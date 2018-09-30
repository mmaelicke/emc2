import {Injectable} from '@angular/core';
import {Hit} from './hit.model';
import {ElasticTransportService} from './elastic-transport.service';
import {Context} from '../../models/context.model';
import {MessageService} from '../message.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Page} from '../../models/page.model';
import {IndexResponse} from './elastic-response.model';
import {Variables} from './elastic-response.model';
import {SettingsService} from '../settings.service';
import { Client } from 'elasticsearch-browser';
import * as elasticsearch from 'elasticsearch-browser';
import {SearchResponse} from 'elasticsearch';
import index from '@angular/cli/lib/cli';

@Injectable()
export class ElasticsearchService {
  private client: Client;
  private _isActive = false;
  active: BehaviorSubject<boolean>;
  private lastStatus = 'inactive';

  // current Hits
  private _hits: Hit[] = [];
  private _contexts: Context[] = [];
  private _variables: Variables[] = [];
  contexts = new BehaviorSubject<Context[]>(this._contexts);
  variables = new BehaviorSubject<Variables[]>(this._variables);
  hits = new BehaviorSubject<Hit[]>(this._hits);

  // parameters of the last search
  lastQueryTime: number;
  lastTimedOut: boolean;
  currentHitMeta: {total: number, max_score: number};

  constructor(private transport: ElasticTransportService, private messages: MessageService, private settings: SettingsService) {
    // init the active Subject
    this.active = new BehaviorSubject<boolean>(this._isActive);

    // build the Elasticsearch Client
    this.client = new elasticsearch.Client({
      host: this.settings.elasticHost.getValue(),
      apiVersion: '6.2',
      log: 'error'
    });
    // subscribe to the Settings
    this.settings.elasticHost.subscribe(
      (newHost: string) => {
        this.client = new Client({
          host: newHost,
          apiVersion: '6.2',
          log: 'error'
        });
      }
    );
    // activate the check Cluster loop
    this.pingCluster();
  }

  private pingCluster() {
    this.client.ping({}).then(
      () => {
        // store last status
        this.lastStatus = this.active.getValue() ? 'active' : 'inactive';
        // update the status
        this.active.next(true);

        // reload context and variables
        if (this.lastStatus === 'inactive' && this.active.getValue()) {
          // was inactive, got active now
          this.loadContexts();
          this.loadVariables();
          this.messages.success('Elastic Cluster online.');
        }
      },
      () => {
        console.log('pingCluster then->onrejected');
        this.active.next(false);
      }
    ).catch(
      () => {
        console.log('pingCluster catch->onrejected');
        this.active.next(false);
      }
    );
    setTimeout(this.pingCluster.bind(this), this.settings.refreshStatus.getValue());
  }

  getHitAtIndex(index: number) {
    return this._hits.slice()[index];
  }

  getContexts() {
    return this._contexts.slice();
  }

  private loadContexts() {
    this.client.search({
      index: 'mgn', type: 'context', size: 150
    }).then(
      (resp: SearchResponse<any>) => {
        const contexts: Context[] = [];
        for (const context of resp.hits.hits) {
          contexts.push(new Context(context._id, context._source.name, context._source.part_of, context._source.index));
        }
        this._contexts = contexts;
        this.contexts.next(this._contexts);
      },
      () => {
        this._contexts = [];
        this.contexts.next(this._contexts);
      }
    );
  }

  loadVariables(activeContext= 'global') {
    this.client.search({
      index: activeContext, type: 'page', size: 0,
      body: {
        aggs: {
          variables: {
            terms: {
              field: 'variable.raw',
              size: 100
            }
          }
        }
      }
    }).then(
      (resp: SearchResponse<any>) => {
        this._variables = [];
        for (const bucket of resp.aggregations.variables.buckets) {
          this._variables.push({name: bucket.key, count: bucket.doc_count});
        }
        this.variables.next(this._variables);
      },
      () => {
        this.variables.next([]);
        console.log('DEV: No variables found');
      }
    );
  }

  createGlobalContext() {
    this.client.index({
      index: 'mgn', type: 'context',
      body: {
        name: 'global'
      }
    }).then(
      () => { this.messages.success('Successfully added global Context'); },
      (error) => { this.messages.error('Something went wrong: \n' + error.toString() ); }
    );
//    this.transport.putGlobalContext().subscribe(
//      value => {this.messages.success('Successfully added global Context'); },
//      error => {this.messages.error('Something went wrong: \n' + error.toString() ); }
//    );
  }

  private createAliases(context: Context) {
    // get the alias names
    const aliases = context.part_of.slice();

    // create every name as alias
    for (const alias of aliases) {
      this.client.indices.putAlias({
        index: context.index, name: alias
      }).then(
        () => {},
        (error) => {
          this.messages.error('Could not create Alias' + alias + '.<br>' + error);
        }
      );
    }
  }

  createNewContext(context: Context, mappingString: string) {
    // if the Context is not part of the global context, add it
    if (!context.part_of.find(n => n === 'global')) {
      context.part_of.push('global');
    }
    // parse the mapping back
    const mapping = JSON.parse(mappingString);
    // create the new context
    this.client.index({
      index: 'mgn', type: 'context',
      body: {
        name: context.name, part_of: context.part_of, index: context.index
      }
    }).then(
      () => {
        // create a new index
        this.client.indices.create({
          index: context.index, body: {settings: mapping.settings, mappings: mapping.mappings}
        }).then(
          () => {
            // put the new aliases
            this.createAliases(context);
            // Success message and reload contexts after 1 second
            this.messages.success('created context ' + context.name, 'Created Context');
            setTimeout(this.loadContexts.bind(this), 1100);

          },
          (error) => {
            this.messages.error('Could not create Index: ' + error);
            // TODO: here, the context is created, but the index not, therefore remove the context again
          }
        );
      },
      (error) => {
        this.messages.error('Could not create new Context.<br>' + error);
      }
    );
  }

  async editContext(context: Context) {
    // check if global exists
    if(!context.part_of.find(n => n === 'global')) {
      context.part_of.push('global');
    }

    // assure that the global context is in part_of
    const contextEntry = await this.client.get({
      index: 'mgn', type: 'context', id: context.id
    });
    // TODO a little bit of error handling here
    // TODO: maybe rework the await part into a chain of then
    const originalContext: Context = contextEntry._source;

    // update the entry
    this.client.update({
      index: 'mgn', type: 'context', id: context.id, body: {
        doc: { name: context.name, part_of: context.part_of, index: context.index }
      }
    }).then(
      () => {
        // delete the old Aliases
        for (const alias of originalContext.part_of.slice()) {
          this.client.indices.deleteAlias({
            index: context.index, name: alias
          });
        }
        // create the missing aliases
        setTimeout(this.createAliases(context), 500);

        // recreate the Context list
        setTimeout(this.loadContexts.bind(this), 1100);
        this.messages.success('Edited Context ' + context.name);
        },
      (error) => {this.messages.error('Context ' + context.name + ' failed.\n' + error ); }
    );
  }

  deleteContext(context: Context, deleteIndex= true) {
    if (deleteIndex) {
      this.client.indices.delete({
        index: context.index
      }).then(
        () => { this.messages.success('Index ' + context.index + ' deleted.'); },
        (error) => { this.messages.error('The index ' + context.index + ' could not be deleted.<br>' + error.message); }
      );
    }

    // Delete the context Entry
    this.client.delete({
      index: 'mgn', type: 'context', id: context.id
    }).then(
      () => {
        // reload the Context list after one second
        setTimeout(this.loadContexts.bind(this), 1000);
        this.messages.success('Context ' + context.name + ' (ID: ' + context.id + ') deleted', 'Deleted');
      },
      (error) => { this.messages.error('Something went wrong. Error: \n ' + error.message ); }
    );
  }

  createPage(page: Page, context: Context) {
    this.transport.postPage(page, context, true).subscribe(
      (result: IndexResponse) => {
        console.log(result);
        if ( (result._shards.failed !== 0) || (result.result !== 'created') ) {
          this.messages.error('[DEVELOPER]: [Elasicsearch Error]:<br>Indexing failed.<br>' + JSON.stringify(result));
        } else {
          this.messages.success('Created ' + page.title + '.<br>Indexed to ' + result._shards.total + ' nodes.');
        }
      },
      error => { this.messages.error('Could not save the Page.<br>' + error); }
    );
  }

  private parseRawHits(response: SearchResponse<any>) {
    // save the last query parameters
    this.lastQueryTime = response.took;
    this.lastTimedOut = response.timed_out;
    this.currentHitMeta = {total: response.hits.total, max_score: response.hits.max_score};

    // build a Hit object for each hit
    this._hits = [];

    response.hits.hits.forEach((item, index) => {
      this._hits.push(new Hit(item));
    });

    // emit the new hits
    this.hits.next(this._hits);

    // emit the new pages
    // this._pages.length = 0;
    // raw.hits.hits.forEach((item, index) => {
    //  this._pages.push(new Page().from_source(item._source, item._id));
    // });
    // this.pages.next(this._pages.slice());
  }

  onQueryStringChanged(queryString: string, context: string, variable: string) {
    console.log('The query string changed to ' + queryString + '\nContext: ' + context + '\nVariable: ' + variable);
  }

  search(queryString: string, context: Context, variable?: string) {
    this.transport.getSearch(queryString, context.name, variable).subscribe(
      (searchResult: SearchResponse<any>) => {
        console.log(searchResult);
        this.parseRawHits(searchResult);
      },
      (error) => { console.log(error); }
    );
  }
}
