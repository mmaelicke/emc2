import {Component, OnDestroy, OnInit} from '@angular/core';
import {ElasticTransportService} from '../elastic-transport.service';

@Component({
  selector: 'elastic-status',
  templateUrl: './elastic-status.component.html',
  styleUrls: ['./elastic-status.component.css']
})
export class ElasticStatusComponent implements OnInit, OnDestroy {
  isOnline = false;

  constructor(private transport: ElasticTransportService) { }

  ngOnInit() {
    this.transport.isActive.subscribe(
      value => {
        this.isOnline = value;
      }
    );
  }

  ngOnDestroy() {
    this.transport.isActive.unsubscribe();
  }

}
