import {Injectable} from '@angular/core';
import {Hit} from './hit.model';
import {ElasticTransportService} from './elastic-transport.service';
import {Context} from '../../models/context.model';
import {MessageService} from '../message.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Page} from '../../models/page.model';
import {IndexResponse, SearchResponse} from './elastic-response.model';
import {Variables} from './elastic-response.model';

@Injectable()
export class ElasticsearchService {
  isActive = false;
  private lastStatus = 'inactive';

  // current Hits
  private _hits: Hit[] = [];
  private _contexts: Context[] = [];
  private _variables: Variables[] = [];
  contexts = new BehaviorSubject<Context[]>(this._contexts);
  variables = new BehaviorSubject<Variables[]>(this._variables);
  hits = new BehaviorSubject<Hit[]>(this._hits);

  // pages
  // private _pages: Page[] = [];
  // pages = new BehaviorSubject<Page[]>(this._pages);

  // parameters of the last search
  lastQueryTime: number;
  lastTimedOut: boolean;
  currentHitMeta: {total: number, max_score: number};

  constructor(private transport: ElasticTransportService, private messages: MessageService) {
    // list to the status of the transport service
    this.transport.isActive.subscribe(
      (value: boolean) => {
        // save the last status
        this.lastStatus = this.isActive ? 'active' : 'inactive';
        this.isActive = value;

        // check if it just got active
        if (this.lastStatus === 'inactive' && this.isActive) {
          // the service just got active, reload all contexts
          this.loadContexts();

          // reload all variables
          this.loadVariables();

          this.messages.success('Elastic Cluster online.');
        }
      }
    );
  }

  getContexts() {
    return this._contexts.slice();
  }

  private loadContexts() {
    // load all context objects. If the global context does not exist, produce an error
    this.transport.getContexts(50).subscribe(
      (data: Context[]) => {
        if (data.find(context => context.name === 'global')) {
          this._contexts = data;
          this.contexts.next(this._contexts.slice());
        } else {
          this._contexts = [];
          this.contexts.next(this._contexts.slice());
        }
      },
      (error) => {
        this._contexts = [];
        this.contexts.next(this._contexts.slice());
      }
    );
  }

  loadVariables(activeContext= 'global') {
    this.transport.getVariables(activeContext).subscribe(
      (result:{took: number, timed_out: boolean, hits: any, _shards: any, aggregations: any}) => {
        // load the new variables
        const buckets = result.aggregations.variables.buckets;
        this._variables = [];
        buckets.forEach(bucket => this._variables.push({name: bucket.key, count: bucket.doc_count}));

        // emit the new variables lists
        this.variables.next(this._variables);
      },
      error => { this.messages.error('[DEVELOPER]: Cannot load variables.<br>' + error); }
    );
  }

  createGlobalContext() {
    this.transport.putGlobalContext().subscribe(
      value => {this.messages.success('Successfully added global Context'); },
      error => {this.messages.error('Something went wrong: \n' + error.toString() ); }
    );

  }

  createNewContext(context: Context, mappingString: string) {
    // if the Context is not part of the global context, add it
    if (!context.part_of.find(n => n === 'global')) {
      context.part_of.push('global');
    }
    // parse the mapping back
    const mapping = JSON.parse(mappingString);
    // create the new context
    this.transport.postContext(context, true).subscribe(
      (value) => {
        // context created, create index
        this.transport.putIndex(context.index, mapping.settings, mapping.mappings).subscribe(
          (value) => {
            // set alias to the index name
            const aliases = context.part_of.slice();
            aliases.push(context.name);
            // alias the new index
            for (const alias of aliases) {
              this.transport.putAlias(context.index, alias).subscribe(
                value => {},
                error => {this.messages.warning('Could not make context ' + context.name + ' part of ' + alias);}
              );
            }
            this.messages.success('created context ' + context.name, 'Created Context');

            // reload the contexts
            setTimeout(this.loadContexts.bind(this), 1000);
          },
          (error) => {
            this.transport.deleteContext(context.id).subscribe();
            this.messages.error('index ' + context.index  + ' failed.\n' + error.message );
            setTimeout(this.loadContexts.bind(this), 1000);
          }
        );
      },
      (error) => { this.messages.error('context ' + context.name + ' failed.\n' + error ); }
    );
  }

  editContext(context: Context) {
    this.transport.putContext(context).subscribe(
      value => {
        // refresh the contexts and message
        setTimeout(this.loadContexts.bind(this), 1000);
        this.messages.success('Edited Context ' + context.name);
      },
      error => { this.messages.error('Context ' + context.name + ' failed.\n' + error ); }
    );
  }

  deleteContext(context: Context, deleteIndex= true) {
    if (deleteIndex) {
      // delete the index
      this.transport.deleteIndex(context.index).subscribe(
        value => { this.messages.success('Index ' + context.index + ' deleted.');  },
        error => {
          this.messages.error('The index ' + context.index + ' could not be deleted.<br>' + error.message);
        }
      );
    }
    this.transport.deleteContext(context.id).subscribe(
      value => {
        // refresh the contexts and message
        setTimeout(this.loadContexts.bind(this), 1000);
        this.messages.success('Context ' + context.name + ' (ID: ' + context.id + ') deleted', 'Deleted');
      },
      error => { this.messages.error('Something went wrong. Error: \n ' + error.message ); }
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

  private parseRawHits(response: SearchResponse) {
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
      (searchResult: SearchResponse) => {
        console.log(searchResult);
        this.parseRawHits(searchResult);
      },
      (error) => { console.log(error); }
    );
  }
}
