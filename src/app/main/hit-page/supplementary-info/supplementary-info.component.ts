import {Component, Input, OnInit} from '@angular/core';
import {Hit} from '../../../shared/elasticsearch/hit.model';

@Component({
  selector: 'app-supplementary-info',
  templateUrl: './supplementary-info.component.html',
  styleUrls: ['./supplementary-info.component.css']
})
export class SupplementaryInfoComponent implements OnInit {
  @Input() hit: Hit;

  constructor() { }

  ngOnInit() {
  }

}
