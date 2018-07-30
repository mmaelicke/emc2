import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MainComponent} from './main/main.component';
import {PageNotFoundComponent} from './generic/page-not-found/page-not-found.component';
import {SettingsComponent} from './settings/settings.component';
import {ImporterComponent} from './importer/importer.component';
import {EditContextComponent} from './settings/context-manager/edit-context/edit-context.component';
import {ResultListComponent} from './main/result-list/result-list.component';
import {StartPageComponent} from './generic/start-page/start-page.component';
import {HitPageComponent} from './main/hit-page/hit-page.component';
import {GeneralInfoComponent} from './main/hit-page/general-info/general-info.component';
import {SupplementaryInfoComponent} from './main/hit-page/supplementary-info/supplementary-info.component';
import {DataViewComponent} from './main/hit-page/data-view/data-view.component';

const appRoutes = [
  {path: 'import', component: ImporterComponent},
  {path: 'settings', component: SettingsComponent, children: [
      {path: 'context/new', component: EditContextComponent},
      {path: 'context/:id', component: EditContextComponent}
    ]},
  {path: '', component: MainComponent, children: [
      {path: '', component: StartPageComponent, pathMatch: 'full'},
      {path: 'r', component: ResultListComponent},
      {path: 'r/:id', component: HitPageComponent},
    ]},
  {path: '**', component: PageNotFoundComponent}
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {useHash: false})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
