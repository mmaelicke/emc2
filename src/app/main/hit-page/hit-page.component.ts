import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {MessageService} from '../../shared/message.service';
import {Hit} from '../../shared/elasticsearch/hit.model';
import {ElasticsearchService} from '../../shared/elasticsearch/elasticsearch.service';

@Component({
  selector: 'app-hit-page',
  templateUrl: './hit-page.component.html',
  styleUrls: ['./hit-page.component.css']
})
export class HitPageComponent implements OnInit {
  hit: Hit;
  currentItem: number;
  totalItems: number;

  constructor(private activeRoute: ActivatedRoute, private message: MessageService, private es: ElasticsearchService) { }

  ngOnInit() {
    this.currentItem = Number(this.activeRoute.snapshot.paramMap.get('id'));
    this.hit = this.es.getHitatIndex(this.currentItem);
    this.totalItems = this.es.hits.getValue().length;

    this.activeRoute.params.subscribe(
      (params: Params) => {
        this.currentItem = Number(params['id']);
        this.hit = this.es.getHitatIndex(this.currentItem);
      }
    );
  }

}
