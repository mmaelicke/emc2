import {Component, Input, OnInit, Output} from '@angular/core';
import { Hit } from '../../../models/hit.model';

@Component({
  selector: 'app-result-list-item',
  templateUrl: './result-list-item.component.html',
  styleUrls: ['./result-list-item.component.css']
})
export class ResultListItemComponent implements OnInit {
  // set by the parent element
  @Input() hitItem: Hit;
  @Input() itemStyle = 'plain';

  // visibility toggler
  @Output() isVisible = false;

  constructor() { }

  ngOnInit() {
  }

}
