import {Injectable} from '@angular/core';
import {Hit} from '../../models/hit.model';
import {ElasticTransportService} from './elastic-transport.service';
import {Context} from '../../models/context.model';
import {MessageService} from '../message.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Page} from '../../models/page.model';
import {IndexResult} from './index-result.model';
import {EsHitResults} from '../../models/es-hit.model';

@Injectable()
export class ElasticsearchService {
  isActive = false;
  private lastStatus = 'inactive';

  // current Hits
  // TODO replace the current Hits by Pages
  currentHits: Hit[] = [];
  private _contexts: Context[] = [];
  contexts = new BehaviorSubject<Context[]>(this._contexts);
  variables = [];

  // pages
  private _pages: Page[] = [];
  pages = new BehaviorSubject<Page[]>(this._pages);

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
          this.messages.success('Elastic Cluster online.');
        }
      }
    );
    // development
    this.parseRawHits(raw);
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
      (result: IndexResult) => {
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

  private parseRawHits(raw: {took: number, timed_out: boolean, _shards: any, hits: any}) {
    // save the last query parameters
    this.lastQueryTime = raw.took;
    this.lastTimedOut = raw.timed_out;
    this.currentHitMeta = {total: raw.hits.total, max_score: raw.hits.max_score};

    // build a Hit object for each hit
    this.currentHits.length = 0;

    raw.hits.hits.forEach((item, index) => {
      this.currentHits.push(new Hit(item));
    });

    // emit the new pages
    this._pages.length = 0;
    raw.hits.hits.forEach((item, index) => {
      this._pages.push(new Page().from_source(item._source, item._id));
    });
    this.pages.next(this._pages.slice());
  }

  onQueryStringChanged(queryString: string, context: string, variable: string) {
    console.log('The query string changed to ' + queryString + '\nContext: ' + context + '\nVariable: ' + variable);
  }

  search(queryString: string, context: Context, variable?: string) {
    this.transport.getSearch(queryString, context.name, variable).subscribe(
      (value: EsHitResults) => { console.log(value); },
      (error) => { console.log(error); }
    );
  }
}

const raw = {
  'took' : 15,
  'timed_out' : false,
  '_shards' : {
    'total' : 2,
    'successful' : 2,
    'skipped' : 0,
    'failed' : 0
  },
  'hits' : {
    'total' : 62,
    'max_score' : 4.2881956,
    'hits' : [
      {
        '_index' : 'caos_v1',
        '_type' : 'page',
        '_id' : '6sFDs2EB9c-OisfWTlf_',
        '_score' : 4.2881956,
        '_source' : {
          'supplementary' : {
            'elevation' : 429.0,
            'geology' : 'schist',
            'spacing' : '5min',
            'site_comment' : 'midslope S',
            'land use' : 'forest',
            'sensor' : 'Sap Flow sensor (East 30 Sensors)'
          },
          'coordinates' : {
            'lat' : 49.8084884662771,
            'lon' : 5.80788292162056
          },
          'license' : 'Usage without permission not allowed',
          'edited' : '2018-02-20 07:45:02',
          'location' : 'POINT (5.80788292162056 49.8084884662771)',
          'variable' : 'sap flow',
          'identifiers' : [
            1033,
            'ST::a'
          ],
          'description' : 'Sap flow velocity measured with East 30 Sensors heat pulse Sap Flow Sensors',
          'title' : 'sap flow [m/s] data measured within the CAOS project',
          'created' : '2018-02-20 07:45:02',
          'owner' : 'German Research Centre for Geosciences GFZ (Sektion 5.4 - Hydrology)'
        }
      },
      {
        '_index' : 'caos_v1',
        '_type' : 'page',
        '_id' : 'usFDs2EB9c-OisfWTVXz',
        '_score' : 3.7078974,
        '_source' : {
          'supplementary' : {
            'elevation' : 429.0,
            'geology' : 'schist',
            'spacing' : '5min',
            'site_comment' : 'midslope S',
            'land use' : 'forest',
            'sensor' : '5TE sensor (Decagon Devices)'
          },
          'coordinates' : {
            'lat' : 49.8084854001542,
            'lon' : 5.80783112603448
          },
          'license' : 'Usage without permission not allowed',
          'edited' : '2018-02-20 07:45:02',
          'location' : 'POINT (5.80783112603448 49.8084854001542)',
          'variable' : 'volumetric water content',
          'identifiers' : [
            1056,
            'ST::i'
          ],
          'description' : 'Volumetric water of soil content measured at 30 cm with Decagon 5TE',
          'title' : 'volumetric water content [%] data measured within the CAOS project',
          'created' : '2018-02-20 07:45:02',
          'owner' : 'German Research Centre for Geosciences GFZ (Sektion 5.4 - Hydrology)'
        }
      },
      {
        '_index' : 'caos_v1',
        '_type' : 'page',
        '_id' : 'u8FDs2EB9c-OisfWTVXz',
        '_score' : 3.7078974,
        '_source' : {
          'supplementary' : {
            'elevation' : 429.0,
            'geology' : 'schist',
            'spacing' : '5min',
            'site_comment' : 'midslope S',
            'land use' : 'forest',
            'sensor' : '5TE sensor (Decagon Devices)'
          },
          'coordinates' : {
            'lat' : 49.8084854001542,
            'lon' : 5.80783112603448
          },
          'license' : 'Usage without permission not allowed',
          'edited' : '2018-02-20 07:45:02',
          'location' : 'POINT (5.80783112603448 49.8084854001542)',
          'variable' : 'volumetric water content',
          'identifiers' : [
            1055,
            'ST::i'
          ],
          'description' : 'Volumetric water of soil content measured at 10 cm with Decagon 5TE',
          'title' : 'volumetric water content [%] data measured within the CAOS project',
          'created' : '2018-02-20 07:45:02',
          'owner' : 'German Research Centre for Geosciences GFZ (Sektion 5.4 - Hydrology)'
        }
      },
      {
        '_index' : 'caos_v1',
        '_type' : 'page',
        '_id' : 'vMFDs2EB9c-OisfWTVXz',
        '_score' : 3.7078974,
        '_source' : {
          'supplementary' : {
            'elevation' : 429.0,
            'geology' : 'schist',
            'spacing' : '5min',
            'site_comment' : 'midslope S',
            'land use' : 'forest',
            'sensor' : '5TE sensor (Decagon Devices)'
          },
          'coordinates' : {
            'lat' : 49.8084769353121,
            'lon' : 5.80775249986879
          },
          'license' : 'Usage without permission not allowed',
          'edited' : '2018-02-20 07:45:02',
          'location' : 'POINT (5.80775249986879 49.8084769353121)',
          'variable' : 'volumetric water content',
          'identifiers' : [
            1062,
            'ST::o'
          ],
          'description' : 'Volumetric water of soil content measured at 30 cm with Decagon 5TE',
          'title' : 'volumetric water content [%] data measured within the CAOS project',
          'created' : '2018-02-20 07:45:02',
          'owner' : 'German Research Centre for Geosciences GFZ (Sektion 5.4 - Hydrology)'
        }
      },
      {
        '_index' : 'caos_v1',
        '_type' : 'page',
        '_id' : 'vcFDs2EB9c-OisfWTVXz',
        '_score' : 3.7078974,
        '_source' : {
          'supplementary' : {
            'elevation' : 429.0,
            'geology' : 'schist',
            'spacing' : '5min',
            'site_comment' : 'midslope S',
            'land use' : 'forest',
            'sensor' : '5TE sensor (Decagon Devices)'
          },
          'coordinates' : {
            'lat' : 49.8084483270408,
            'lon' : 5.80781183332555
          },
          'license' : 'Usage without permission not allowed',
          'edited' : '2018-02-20 07:45:02',
          'location' : 'POINT (5.80781183332555 49.8084483270408)',
          'variable' : 'volumetric water content',
          'identifiers' : [
            1060,
            'ST::l'
          ],
          'description' : 'Volumetric water of soil content measured at 50 cm with Decagon 5TE',
          'title' : 'volumetric water content [%] data measured within the CAOS project',
          'created' : '2018-02-20 07:45:02',
          'owner' : 'German Research Centre for Geosciences GFZ (Sektion 5.4 - Hydrology)'
        }
      },
      {
        '_index' : 'caos_v1',
        '_type' : 'page',
        '_id' : 'vsFDs2EB9c-OisfWTVXz',
        '_score' : 3.7078974,
        '_source' : {
          'supplementary' : {
            'elevation' : 429.0,
            'geology' : 'schist',
            'spacing' : '5min',
            'site_comment' : 'midslope S',
            'land use' : 'forest',
            'sensor' : '5TE sensor (Decagon Devices)'
          },
          'coordinates' : {
            'lat' : 49.8084769353121,
            'lon' : 5.80775249986879
          },
          'license' : 'Usage without permission not allowed',
          'edited' : '2018-02-20 07:45:02',
          'location' : 'POINT (5.80775249986879 49.8084769353121)',
          'variable' : 'volumetric water content',
          'identifiers' : [
            1061,
            'ST::o'
          ],
          'description' : 'Volumetric water of soil content measured at 10 cm with Decagon 5TE',
          'title' : 'volumetric water content [%] data measured within the CAOS project',
          'created' : '2018-02-20 07:45:02',
          'owner' : 'German Research Centre for Geosciences GFZ (Sektion 5.4 - Hydrology)'
        }
      },
      {
        '_index' : 'caos_v1',
        '_type' : 'page',
        '_id' : 'v8FDs2EB9c-OisfWTVXz',
        '_score' : 3.7078974,
        '_source' : {
          'supplementary' : {
            'elevation' : 429.0,
            'geology' : 'schist',
            'spacing' : '5min',
            'site_comment' : 'midslope S',
            'land use' : 'forest',
            'sensor' : '5TE sensor (Decagon Devices)'
          },
          'coordinates' : {
            'lat' : 49.8084854001542,
            'lon' : 5.80783112603448
          },
          'license' : 'Usage without permission not allowed',
          'edited' : '2018-02-20 07:45:02',
          'location' : 'POINT (5.80783112603448 49.8084854001542)',
          'variable' : 'volumetric water content',
          'identifiers' : [
            1064,
            'ST::i'
          ],
          'description' : 'Volumetric water of soil content measured at 80 cm with Decagon 5TE',
          'title' : 'volumetric water content [%] data measured within the CAOS project',
          'created' : '2018-02-20 07:45:02',
          'owner' : 'German Research Centre for Geosciences GFZ (Sektion 5.4 - Hydrology)'
        }
      },
      {
        '_index' : 'caos_v1',
        '_type' : 'page',
        '_id' : 'wMFDs2EB9c-OisfWTVXz',
        '_score' : 3.7078974,
        '_source' : {
          'supplementary' : {
            'elevation' : 429.0,
            'geology' : 'schist',
            'spacing' : '5min',
            'site_comment' : 'midslope S',
            'land use' : 'forest',
            'sensor' : '5TE sensor (Decagon Devices)'
          },
          'coordinates' : {
            'lat' : 49.8084769353121,
            'lon' : 5.80775249986879
          },
          'license' : 'Usage without permission not allowed',
          'edited' : '2018-02-20 07:45:02',
          'location' : 'POINT (5.80775249986879 49.8084769353121)',
          'variable' : 'volumetric water content',
          'identifiers' : [
            1063,
            'ST::o'
          ],
          'description' : 'Volumetric water of soil content measured at 50 cm with Decagon 5TE',
          'title' : 'volumetric water content [%] data measured within the CAOS project',
          'created' : '2018-02-20 07:45:02',
          'owner' : 'German Research Centre for Geosciences GFZ (Sektion 5.4 - Hydrology)'
        }
      },
      {
        '_index' : 'caos_v1',
        '_type' : 'page',
        '_id' : 'wcFDs2EB9c-OisfWTVXz',
        '_score' : 3.7078974,
        '_source' : {
          'supplementary' : {
            'elevation' : 429.0,
            'geology' : 'schist',
            'spacing' : '5min',
            'site_comment' : 'midslope S',
            'land use' : 'forest',
            'sensor' : '5TE sensor (Decagon Devices)'
          },
          'coordinates' : {
            'lat' : 49.8084483270408,
            'lon' : 5.80781183332555
          },
          'license' : 'Usage without permission not allowed',
          'edited' : '2018-02-20 07:45:02',
          'location' : 'POINT (5.80781183332555 49.8084483270408)',
          'variable' : 'volumetric water content',
          'identifiers' : [
            1059,
            'ST::l'
          ],
          'description' : 'Volumetric water of soil content measured at 30 cm with Decagon 5TE',
          'title' : 'volumetric water content [%] data measured within the CAOS project',
          'created' : '2018-02-20 07:45:02',
          'owner' : 'German Research Centre for Geosciences GFZ (Sektion 5.4 - Hydrology)'
        }
      },
      {
        '_index' : 'caos_v1',
        '_type' : 'page',
        '_id' : 'wsFDs2EB9c-OisfWTVXz',
        '_score' : 3.7078974,
        '_source' : {
          'supplementary' : {
            'elevation' : 429.0,
            'geology' : 'schist',
            'spacing' : '5min',
            'site_comment' : 'midslope S',
            'land use' : 'forest',
            'sensor' : 'CS 215 sensor (Campbell Scientific)'
          },
          'coordinates' : {
            'lat' : 49.8084707084095,
            'lon' : 5.80780864054337
          },
          'license' : 'Usage without permission not allowed',
          'edited' : '2018-02-20 07:45:02',
          'location' : 'POINT (5.80780864054337 49.8084707084095)',
          'variable' : 'air temperature',
          'identifiers' : [
            1085,
            'ST::z'
          ],
          'description' : 'Air temperature measured at 2 m with Campbell CS 215',
          'title' : 'air temperature [C] data measured within the CAOS project',
          'created' : '2018-02-20 07:45:02',
          'owner' : 'German Research Centre for Geosciences GFZ (Sektion 5.4 - Hydrology)'
        }
      }
    ]
  }
};
