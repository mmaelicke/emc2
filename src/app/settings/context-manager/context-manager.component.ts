import {Component, OnDestroy, OnInit} from '@angular/core';
import {Context} from '../../models/context.model';
import {Router} from '@angular/router';
import {ElasticsearchService} from '../../shared/elasticsearch/elasticsearch.service';
import {Subscription} from 'rxjs/internal/Subscription';

@Component({
  selector: 'context-manager',
  templateUrl: './context-manager.component.html',
  styleUrls: ['./context-manager.component.css']
})
export class ContextManagerComponent implements OnInit, OnDestroy {
  contexts: Context[] = [];
  contextSubscription: Subscription;

  constructor(private es: ElasticsearchService, private router: Router) { }

  ngOnInit() {
    // get current Contexts and subscribe to changes
    this.contexts = this.es.getContexts();
    this.contextSubscription = this.es.contexts.subscribe((contexts: Context[]) => {
      this.contexts = contexts;
    });
  }

  onCreateGlobalContext() {
    this.es.createGlobalContext();

    // re-navigate to settings
    setTimeout(() => {
      this.router.navigate(['settings']);
    }, 500);
  }

  onDeleteContext(index: number) {
    this.es.deleteContext(this.contexts[index]);
  }

  ngOnDestroy() {
    this.contextSubscription.unsubscribe();
  }
}
