import {Component, OnDestroy, OnInit} from '@angular/core';
import {ElasticsearchService} from '../../shared/elasticsearch/elasticsearch.service';
import {Hit} from '../../models/hit.model';
import {SettingsService} from '../../shared/settings.service';
import {Subscription} from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-result-list',
  templateUrl: './result-list.component.html',
  styleUrls: ['./result-list.component.css']
})
export class ResultListComponent implements OnInit, OnDestroy {
  hits: Hit[];
  listStyle: string;
  listStyleSubscription: Subscription;

  constructor(private es: ElasticsearchService, private settings: SettingsService) { }

  ngOnInit() {
    // load the default list style from the settings
    // this.listStyle = this.settings.getSetting('defaultListStyle');
    this.listStyle = this.settings.defaultListStyle.getValue();
    this.listStyleSubscription = this.settings.defaultListStyle.subscribe(
      (value: string)  => {
        this.listStyle = value;
      }
    );

    // maybe this has to be bound by an observable
    this.hits = this.es.currentHits;
  }

  ngOnDestroy() {
    this.listStyleSubscription.unsubscribe();
  }

}
