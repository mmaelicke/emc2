import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {SettingsService} from '../settings.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {map} from 'rxjs/operators';
import {Context} from '../../models/context.model';
import {EsHitResults} from '../../models/es-hit.model';
import {throwError} from 'rxjs/internal/observable/throwError';
import {Page} from '../../models/page.model';

@Injectable()
export class ElasticTransportService {
  // state variables
  isActive = new BehaviorSubject(false);

  // predefined error messages
  private notActiveError = 'Elastic Cluster is not active. Please check the connection.';

  constructor(private http: HttpClient, private settings: SettingsService) {
    // start checking the cluster Status, first check after half a second
    setTimeout(this.checkClusterStatus.bind(this), 500);
  }

  pingCluster() {
    return this.http.head(this.settings.elasticHost.getValue());
  }

  checkClusterStatus() {
    this.pingCluster().subscribe(
      (value) => { this.isActive.next(true); },
      (error) => { this.isActive.next(false); }
    );

    // call this method using a timeout
    setTimeout(this.checkClusterStatus.bind(this), this.settings.refreshStatus.getValue());
  }

  getContexts(size= 50) {
    if (this.isActive) {
      return this.http.get(
        this.settings.elasticHost.getValue() + '/mgn/context/_search?size=' + size
      ).pipe(
        map(
          (data: EsHitResults) => {
            const contexts: Context[] = [];
            for (const context of data.hits.hits) {
              contexts.push(new Context(context._id, context._source.name, context._source.part_of, context._source.index));
            }
            return contexts;
          }
        )
      );
    } else {
      return throwError(this.notActiveError);
    }
  }

  postContext(context: Context, forceID= false) {
    if (!this.isActive) {
      return throwError(this.notActiveError);
    }

    // determine if there is a ID
    let id: string;
    if (context.id) {
      id = context.id;
    } else {
      if (forceID) {
        id = '';
      } else {
        return throwError('[DEVELOPER]: This document doesn\'t have a ID, but forceID was set to false.');
      }
    }

    return this.http.post(
      this.settings.elasticHost.getValue() + '/mgn/context/' + id, {
        name: context.name,
        part_of: context.part_of,
        index: context.index
      }
    );
  }

  putContext(context: Context) {
    if (!this.isActive) {
      return throwError(this.notActiveError);
    }
    // send the PUT request
    return this.http.put(
      this.settings.elasticHost.getValue() + '/mgn/context/' + context.id, {
        name: context.name,
        part_of: context.part_of,
        index: context.index
      }
    );
  }

  deleteContext(id: string) {
    if (!this.isActive) {
      return throwError(this.notActiveError);
    }

    return this.http.delete(
      this.settings.elasticHost.getValue() + '/mgn/context/' + id
    );
  }

  putGlobalContext() {
    if (!this.isActive) {
      return throwError(this.notActiveError);
    }
    return this.http.put(
      this.settings.elasticHost.getValue() + '/mgn/context/global', {name: 'global'}
    );
  }

  getIndex(name: string) {
    if (this.isActive) {
      return this.http.get(
        this.settings.elasticHost.getValue() + '/' + name
      );
    } else {
      return throwError(this.notActiveError);
    }
  }

  putIndex(name: string, settings?: {}, mappings?:{}) {
    if (!this.isActive) {
      return throwError(this.notActiveError);
    }
    return this.http.put(
//      this.settings.elasticHost.getValue() + '/' + name, JSON.parse(mapping)
      this.settings.elasticHost.getValue() + '/' + name, {settings: settings, mappings: mappings}
    );
  }

  deleteIndex(id: string) {
    if (!this.isActive) {
      return throwError(this.notActiveError);
    }

    return this.http.delete(
      this.settings.elasticHost.getValue() + '/' + id
    );
  }

  postPage(page: Page, context: Context, forceID= false) {
    if (!this.isActive) {
      return throwError(this.notActiveError);
    }

    // determine the id
    let id: string;

    if (page.id) {
      id = page.id;
    } else {
      delete page.id;
      if (forceID) {
        id = '';
      } else {
        return throwError('[DEVELOPER]: This document doesn\'t have a ID, but forceID was set to false.');
      }
    }

    return this.http.post(
      this.settings.elasticHost.getValue() + '/' + context.index + '/page/' + id, page
    );
  }

  putAlias(index: string, alias: string) {
    if (!this.isActive) {
      return throwError(this.notActiveError);
    }

    return this.http.put(
      this.settings.elasticHost.getValue() + '/' + index + '/_alias/' + alias, {}
    );
  }

  getSearch(queryString: string, contextName: string, variableName?: string) {
    if (!this.isActive) {
      return throwError(this.notActiveError);
    }

    const multi_match = {
      'query': queryString,
      'type': 'best_field',
      'tie_breaker': 0.3
    };

    let query = {};
    if (variableName) {
      query = {
        'bool': {
          'must': {
            'multi_match': multi_match
          },
          'filter': {
            'term': {
              'variable': variableName
            }
          }
        }
      };
    } else {
      query = {
        'multi_match': multi_match
      };
    }

    return this.http.post(
      this.settings.elasticHost.getValue() + '/' + contextName + '/page/_search', { query: query }
    );
  }
}
