import {Component, Input, OnInit, Output} from '@angular/core';
import { Hit } from '../../../../shared/elasticsearch/hit.model';

@Component({
  selector: 'app-result-list-item',
  templateUrl: './result-list-item.component.html',
  styleUrls: ['./result-list-item.component.css']
})
export class ResultListItemComponent implements OnInit {
  // set by the parent element
  @Input() hitItem: Hit;
  @Input() itemStyle = 'plain';

  // the index on ElasticsearchService Hits
  @Input() listId: number;

  // visibility toggler
  @Output() isVisible = false;

  constructor() { }

  ngOnInit() {
  }

}
