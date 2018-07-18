import { Component, OnInit } from '@angular/core';
import {SettingsService} from '../shared/settings.service';
import {ElasticTransportService} from '../shared/elasticsearch/elastic-transport.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  // general properties
  useCookies: boolean;

  // settings properties
  defaultListStyle: string;
  maxResults: number;
  elasticHost: string;
  elasticHostValid = false;
  refreshStatus: number;

  constructor(private settings: SettingsService, private transport: ElasticTransportService) { }

  ngOnInit() {
    // Cookie settings
    this.useCookies = this.settings.useCookie.getValue();
    this.settings.useCookie.subscribe(state => {this.useCookies = state;});

    // load the current values from the settings service
    this.defaultListStyle = this.settings.defaultListStyle.getValue();
    this.elasticHost = this.settings.elasticHost.getValue();
    this.refreshStatus = this.settings.refreshStatus.getValue() / 1000;
    this.maxResults = this.settings.maxResults.getValue();

    // check if the current host is valid
    this.transport.pingCluster().subscribe(
      value => { this.elasticHostValid = true; },
      error => { this.elasticHostValid = false; }
    );
  }

  onDefaultListStyleChanged() {
    this.settings.defaultListStyle.next(this.defaultListStyle);
  }

  onElasticHostChanged() {
    this.settings.elasticHost.next(this.elasticHost);
    this.transport.pingCluster().subscribe(
      value => {
        this.elasticHostValid = true;
        },
      error => {
        this.elasticHostValid = false;
      }
    );
  }

  onRefreshStatusChanged() {
    this.settings.refreshStatus.next(this.refreshStatus * 1000);
  }

  onMaxResultsChanged() {
    this.settings.maxResults.next(this.maxResults);
  }

  onAcceptCookies() {
    // the user accepted the Cookies, setup Cookies for 60 days
    this.settings.setupCookies(60);
  }

}
