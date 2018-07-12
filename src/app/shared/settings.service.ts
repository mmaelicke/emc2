import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

export class SettingsService {
  private settings: {
    elasticHost: string[],
    refreshStatus: number,
    matchType: string,
  };

  // this should be removed into a subject
  defaultListStyle: BehaviorSubject<string>;
  elasticHost: BehaviorSubject<string>;
  refreshStatus: BehaviorSubject<number>;

  constructor() {
    this.settings = {
      'elasticHost': ['http://localhost:9200'],
      'refreshStatus': 20000,
      'matchType': 'best_field',
    };

    // DEV: prepopulation
    this.defaultListStyle = new BehaviorSubject('table');
    this.elasticHost = new BehaviorSubject('http://localhost:9200');
    this.refreshStatus = new BehaviorSubject(20000);
  }

  getSetting(settingName: string) {
    return this.settings[settingName];
  }
}
