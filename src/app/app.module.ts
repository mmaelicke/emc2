import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';


import { AppComponent } from './app.component';
import { NavigationComponent } from './navigation/navigation.component';
import { MainComponent } from './main/main.component';
import { SearchBarComponent } from './navigation/search-bar/search-bar.component';
import { ResultListComponent } from './main/result/result-list/result-list.component';
import {ElasticsearchService} from './shared/elasticsearch/elasticsearch.service';
import { ResultListItemComponent } from './main/result/result-list/result-list-item/result-list-item.component';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import {LeafletModule} from '@asymmetrik/ngx-leaflet';
import { PageNotFoundComponent } from './generic/page-not-found/page-not-found.component';
import {AppRoutingModule} from './app-routing.module';
import { SidebarComponent } from './navigation/sidebar/sidebar.component';
import {SettingsService} from './shared/settings.service';
import { SettingsComponent } from './settings/settings.component';
import { ImporterComponent } from './importer/importer.component';
import { ElasticStatusComponent } from './shared/elasticsearch/elastic-status/elastic-status.component';
import {ElasticTransportService} from './shared/elasticsearch/elastic-transport.service';
import {HttpClientModule} from '@angular/common/http';
import { MessageComponent } from './generic/message/message.component';
import { ContextManagerComponent } from './settings/context-manager/context-manager.component';
import { EditContextComponent } from './settings/context-manager/edit-context/edit-context.component';
import {MessageService} from './shared/message.service';
import { PageEditComponent } from './importer/page-edit/page-edit.component';
import {TagInputModule} from 'ngx-chips';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaplayersService} from './shared/maplayers.service';
import {CookieService} from 'ngx-cookie-service';
import { StartPageComponent } from './generic/start-page/start-page.component';
import { HitPageComponent } from './main/hit-page/hit-page.component';
import { GeneralInfoComponent } from './main/hit-page/general-info/general-info.component';
import { SupplementaryInfoComponent } from './main/hit-page/supplementary-info/supplementary-info.component';
import { DataViewComponent } from './main/hit-page/data-view/data-view.component';
import { MapComponent } from './main/result/map/map.component';
import { ResultComponent } from './main/result/result.component';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    MainComponent,
    SearchBarComponent,
    ResultListComponent,
    ResultListItemComponent,
    PageNotFoundComponent,
    SidebarComponent,
    SettingsComponent,
    ImporterComponent,
    ElasticStatusComponent,
    MessageComponent,
    ContextManagerComponent,
    EditContextComponent,
    PageEditComponent,
    StartPageComponent,
    HitPageComponent,
    GeneralInfoComponent,
    SupplementaryInfoComponent,
    DataViewComponent,
    MapComponent,
    ResultComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    AngularFontAwesomeModule,
    LeafletModule.forRoot(),
    AppRoutingModule,
    ReactiveFormsModule,
    TagInputModule
  ],
  providers: [
    ElasticsearchService,
    SettingsService,
    ElasticTransportService,
    MessageService,
    MaplayersService,
    CookieService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
