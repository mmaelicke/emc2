import {Component, OnDestroy, OnInit} from '@angular/core';
import {ElasticTransportService} from '../elastic-transport.service';
import {ElasticsearchService} from '../elasticsearch.service';
import {Subscription} from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-elastic-status',
  templateUrl: './elastic-status.component.html',
  styleUrls: ['./elastic-status.component.css']
})
export class ElasticStatusComponent implements OnInit, OnDestroy {
  isOnline = false;
  statusSubscription: Subscription;

  constructor(private es: ElasticsearchService) { }

  ngOnInit() {
    this.statusSubscription = this.es.active.subscribe(
      value => {
        this.isOnline = value;
      }
    );
  }

  ngOnDestroy() {
    this.statusSubscription.unsubscribe();
  }

}
