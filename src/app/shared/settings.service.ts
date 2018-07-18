import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {CookieService} from 'ngx-cookie-service';
import {Injectable} from '@angular/core';

@Injectable()
export class SettingsService {
  useCookie = new BehaviorSubject(false);

  // private defaultSettings = {
  //     'elasticHost': ['http://localhost:9200'],
  //     'refreshStatus': 20000,
  //     'matchType': 'best_fields',
  //     'maxVariableCount': 100,
  //     'maxResults': 15,
  //   };

  // Application Settings
  defaultListStyle: BehaviorSubject<string>;
  maxResults: BehaviorSubject<number>;

  // Elasticsearch Settings
  matchType: BehaviorSubject<string>;
  elasticHost: BehaviorSubject<string>;
  refreshStatus: BehaviorSubject<number>;
  maxVariableCount: BehaviorSubject<number>;

  constructor(private cookieStore: CookieService) {
    this.checkCookies();

    // DEV: pre-population
    if (!this.useCookie.getValue()) {
      this.defaultListStyle = new BehaviorSubject('table');
      this.maxResults = new BehaviorSubject(15);
      this.elasticHost = new BehaviorSubject('http://localhost:9200');
      this.refreshStatus = new BehaviorSubject(20000);
      this.matchType = new BehaviorSubject('best_fields');
      this.maxVariableCount = new BehaviorSubject(100);
    } else {
      this.loadCookies();
      this.initCookies();
    }
  }

  private expirationDate(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  checkCookies() {
    // if the emc2 cookie is available, use cookies
    if (this.cookieStore.check('emc2')) {
      this.useCookie.next(true);

      // reset the emc2 cookie to live for 60 more days
      this.resetEmc2cookie();
    } else {
      this.useCookie.next(false);
    }
  }

  resetEmc2cookie(days= 60) {
    // the emc2 cookie has to be updated or created
    this.cookieStore.set('emc2', 'version_number', this.expirationDate(days));
  }

  setupCookies(days= 60) {
    // the cookies for all settings need to be created
    this.resetEmc2cookie(days);

    const expDate = this.expirationDate(days);

    // set the cookies
    this.cookieStore.set('defaultListStyle', this.defaultListStyle.getValue(), expDate);
    this.cookieStore.set('maxResults', String(this.maxResults.getValue()), expDate);
    this.cookieStore.set('matchType', this.matchType.getValue(), expDate);
    this.cookieStore.set('elasticHost', this.elasticHost.getValue(), expDate);
    this.cookieStore.set('refreshStatus', String(this.refreshStatus.getValue()), expDate);
    this.cookieStore.set('maxVariableCount', String(this.maxVariableCount.getValue()), expDate);

    this.checkCookies();
  }

  loadCookies() {
    // load the actual Cookie values
    this.defaultListStyle = new BehaviorSubject(this.cookieStore.get('defaultListStyle'));
    this.maxResults = new BehaviorSubject(Number(this.cookieStore.get('maxResults')));
    this.elasticHost = new BehaviorSubject(this.cookieStore.get('elasticHost'));
    this.refreshStatus = new BehaviorSubject(Number(this.cookieStore.get('refreshStatus')));
    this.matchType = new BehaviorSubject(this.cookieStore.get('matchType'));
    this.maxVariableCount = new BehaviorSubject(Number(this.cookieStore.get('maxVariableCount')));
  }

  initCookies() {
    // subscribe to all changes in the settings and store them to the cookies
    this.defaultListStyle.subscribe(
      (style: string) => {
        this.cookieStore.set('defaultListStyle', style);
      }
    );
  }
}
