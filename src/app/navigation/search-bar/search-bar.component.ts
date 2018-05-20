import {Component, OnDestroy, OnInit} from '@angular/core';
import {ElasticsearchService} from '../../shared/elasticsearch/elasticsearch.service';
import {Context} from '../../models/context.model';
import {Subscription} from 'rxjs/internal/Subscription';

@Component({
  selector: 'search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnInit, OnDestroy {
  queryString = '';
  queryContext = 'global';
  queryVariable = '-- all --';
  searchOnType = true;
  collapsed = false;

  // populate by all possible values
  contexts: Context[];
  contextSubscription: Subscription;

  constructor(private es: ElasticsearchService) { }

  ngOnInit() {
    // get the current contexts and subscribe to changes
    this.contexts = this.es.getContexts();
    this.contextSubscription = this.es.contexts.subscribe(
      (contexts: Context[]) => {
        this.contexts = contexts;
      }
    );
  }

  // called whenever something changed
  onSearchConditionChanged() {
    this.es.onQueryStringChanged(this.queryString, this.queryContext, this.queryVariable);
  }

  // The input event on the Search bar has its own method to threshold and deactive
  // the search-on-type functionality
  onSearchFieldChanged() {
    if (this.searchOnType && this.queryString.length > 3) {
      this.onSearchConditionChanged();
    }
  }

  ngOnDestroy() {
    this.contextSubscription.unsubscribe();
  }

}
