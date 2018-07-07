import {Component, OnDestroy, OnInit} from '@angular/core';
import {ElasticsearchService} from '../shared/elasticsearch/elasticsearch.service';
import {Context} from '../models/context.model';
import {Subscription} from 'rxjs/index';
import {Router} from '@angular/router';
import {FileChangeEvent} from '@angular/compiler-cli/src/perform_watch';

@Component({
  selector: 'app-importer',
  templateUrl: './importer.component.html',
  styleUrls: ['./importer.component.css']
})
export class ImporterComponent implements OnInit, OnDestroy {
  // Context management
  contexts: Context[];
  contextSubscription: Subscription;
  activeContext = 'global';
  allowImport = false;

  // File properties
  fileString: string;

  constructor(private es: ElasticsearchService) { }

  ngOnInit() {
    // load the Contexts
    this.contexts = this.es.getContexts();
    this.contextSubscription = this.es.contexts.subscribe(
      (contexts: Context[]) => {
        this.contexts = contexts;
        this.checkContexts();
      }
    );
    this.checkContexts();
  }

  private checkContexts() {
    // there has to be more than the global context
    // we need at least one context with a index specification
    if ( !this.contexts.find(c => c.index && c.index.length > 0) ) {
      this.allowImport = false;
    } else {
      this.allowImport = true;
    }
  }

  preview($event) {
    const reader = new FileReader();
    reader.onloadend = (e: any) => {
      console.log(reader.result);
      this.fileString = reader.result;
    };
    reader.readAsText($event.target.files[0]);
  }

  ngOnDestroy() {
    this.contextSubscription.unsubscribe();
  }

}