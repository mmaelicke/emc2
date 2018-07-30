import {Component, Input, OnInit} from '@angular/core';
import {Hit} from '../../../shared/elasticsearch/hit.model';

@Component({
  selector: 'app-data-view',
  templateUrl: './data-view.component.html',
  styleUrls: ['./data-view.component.css']
})
export class DataViewComponent implements OnInit {
  @Input() hit: Hit;

  constructor() { }

  ngOnInit() {
  }

}
