import {Component, Input, OnInit} from '@angular/core';
import {MessageService} from '../../../../shared/message.service';
import {Papa} from 'ngx-papaparse';
import {Hit} from '../../../../shared/elasticsearch/hit.model';

@Component({
  selector: 'app-data-load-csv',
  templateUrl: './data-load-csv.component.html',
  styleUrls: ['./data-load-csv.component.css']
})
export class DataLoadCsvComponent implements OnInit {
  // inputs
  @Input() hit: Hit;

  // internals
  private reader: FileReader;
  rawFileString: string;
  contentAsJson: {}[] = [];
  contentHeader: string[] = [];
  delimiter = ',';

  constructor(private message: MessageService, private papa: Papa) {
  }

  ngOnInit() {
    this.reader = new FileReader();
    this.reader.onloadend = (e: any) => {
      this.rawFileString = this.reader.result;
      this.parseFileString();
    };

    // check if a context and a hit was bound
    if (!this.hit) {
      this.message.error('[DEVELOPER]: No hit bound to DataLoadCsvComponent.');
    }
  }

  parseFileString() {
    this.papa.parse(this.rawFileString, {
      header: true,
      delimiter: this.delimiter,
      complete: results => {
        this.contentAsJson = results.data;
        this.contentHeader = Object.keys(results.data[0]);
      }
    });
  }

  loadFile($event) {
    this.reader.readAsText($event.target.files[0]);
  }

  onImport() {}

  onCancel() {
    // TODO: reset the file upload input
    this.contentHeader = [];
    this.contentAsJson = [];
    this.rawFileString = '';

  }
}
