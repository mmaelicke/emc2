import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ElasticsearchService} from '../../../shared/elasticsearch/elasticsearch.service';
import {Context} from '../../../models/context.model';
import {Hit} from '../../../shared/elasticsearch/hit.model';

@Component({
  selector: 'app-data-load',
  templateUrl: './data-load.component.html',
  styleUrls: ['./data-load.component.css']
})
export class DataLoadComponent implements OnInit {
  @Input() hit: Hit;
  currentItem: number;

  constructor(private route: ActivatedRoute, private es: ElasticsearchService) { }

  ngOnInit() {
    this.currentItem = Number(this.route.snapshot.paramMap.get('id'));
    this.hit = this.es.getHitAtIndex(this.currentItem);
  }

}
