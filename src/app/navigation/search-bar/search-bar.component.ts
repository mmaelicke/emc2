import {Component, OnDestroy, OnInit} from '@angular/core';
import {ElasticsearchService} from '../../shared/elasticsearch/elasticsearch.service';
import {Context} from '../../models/context.model';
import {Subscription} from 'rxjs/internal/Subscription';
import {Variables} from '../../shared/elasticsearch/data.model';
import {SettingsService} from '../../shared/settings.service';
import {Router} from '@angular/router';

@Component({
  selector: 'search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnInit, OnDestroy {
  queryString = '';
  queryContextName: string;
  activeContextSubscription: Subscription;
  queryContext: Context;
  queryVariable = '-- all --';
  searchOnType = true;
  collapsed = false;
  maxVariables: number;
  maxVariablesSubscription: Subscription;

  // populate by all possible values
  contexts: Context[];
  contextSubscription: Subscription;
  variables: Variables[];
  variablesSubscription: Subscription;

  constructor(private es: ElasticsearchService, private settings: SettingsService, private router: Router) { }

  ngOnInit() {
    // get the current contexts and subscribe to changes
    this.contexts = this.es.getContexts();
    this.queryContextName = this.es.activeContextName.getValue();
    this.queryContext = this.es.getContext(this.queryContextName);

    // subscribe to changes
    this.activeContextSubscription = this.es.activeContextName.subscribe(
      (name: string) => {
        this.queryContextName = name;
        this.queryContext = this.es.getContext(this.queryContextName);
        //this.onQueryContextChanged();
      }
    );

    //this.onQueryContextChanged();
    this.contextSubscription = this.es.contexts.subscribe(
      (contexts: Context[]) => {
        this.contexts = contexts;
        this.onQueryContextChanged();
      }
    );

    // get the current variables and subscribe to changes
    this.variables = this.es.variables.getValue();
    this.variablesSubscription = this.es.variables.subscribe(
      (variables: Variables[]) => {
        this.variables = variables;
      }
    );

    // read the aggregation limit for variable counts
    this.maxVariables = this.settings.maxVariableCount.getValue();
    this.maxVariablesSubscription = this.settings.maxVariableCount.subscribe(
      (count: number) => { this.maxVariables = count; }
    );
  }

  onQueryContextChanged() {
    // Push the new name to es.activeContext and it will change the name
    // this.queryContext = this.contexts.find(c => c.name === this.queryContextName);
    //this.queryContext = this.es.getContext(this.queryContextName);
    this.es.activeContextName.next(this.queryContextName);

    // reload the variables
    this.es.loadVariables(this.queryContextName);
  }

  // called whenever something changed
  onSearchConditionChanged() {
    this.es.onQueryStringChanged(this.queryString, this.queryContextName, this.queryVariable);
    //
    if (this.queryVariable !== '-- all --') {
      this.es.search(this.queryString, this.queryContext, this.queryVariable);
    } else {
      this.es.search(this.queryString, this.queryContext);
    }
    // navigate to the Result list component
    this.router.navigate(['/r']);
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
    this.variablesSubscription.unsubscribe();
    this.maxVariablesSubscription.unsubscribe();
    this.activeContextSubscription.unsubscribe();
  }

}
