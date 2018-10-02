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
  activeContextName = 'global';
  activeContextNameSubscription: Subscription;
  activeContext: Context;
  allowImport = false;

  // togglers
  pageToggler = true;
  csvToggler = false;

  constructor(private es: ElasticsearchService) { }

  ngOnInit() {
    // load the Contexts and identify the active context
    this.activeContextName = this.es.activeContextName.getValue();
    this.activeContext = this.es.getContext(this.activeContextName);
    this.contexts = this.es.getContexts();
    //this.onActiveContextChanged();

    // manage the Subscription
    this.contextSubscription = this.es.contexts.subscribe(
      (contexts: Context[]) => {
        this.contexts = contexts;
        this.checkContexts();
        this.onActiveContextChanged();
      }
    );

    this.activeContextNameSubscription = this.es.activeContextName.subscribe(
      (name: string) => {
        this.activeContextName = name;
        this.activeContext = this.es.getContext(name);
      }
    );
    this.checkContexts();
  }

  onActiveContextChanged() {
    // the user changed the activeContextName, therefore it has to be loaded again
    // this.activeContext = this.contexts.find(c => c.name === this.activeContextName);
    // console.log(this.activeContextName, this.activeContext);
    this.es.activeContextName.next(this.activeContextName);
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

  ngOnDestroy() {
    this.contextSubscription.unsubscribe();
    this.activeContextNameSubscription.unsubscribe();
  }

}
