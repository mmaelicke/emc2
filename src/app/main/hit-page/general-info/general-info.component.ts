import {Component, Input, OnInit} from '@angular/core';
import {Hit} from '../../../shared/elasticsearch/hit.model';

@Component({
  selector: 'app-general-info',
  templateUrl: './general-info.component.html',
  styleUrls: ['./general-info.component.css']
})
export class GeneralInfoComponent implements OnInit {
  @Input() hit: Hit;

  constructor() { }

  ngOnInit() {
  }

}
