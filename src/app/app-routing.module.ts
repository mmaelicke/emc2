import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MainComponent} from './main/main.component';
import {PageNotFoundComponent} from './generic/page-not-found/page-not-found.component';
import {SettingsComponent} from './settings/settings.component';
import {ImporterComponent} from './importer/importer.component';
import {EditContextComponent} from './settings/context-manager/edit-context/edit-context.component';
import {StartPageComponent} from './generic/start-page/start-page.component';
import {HitPageComponent} from './main/hit-page/hit-page.component';
import {ResultComponent} from './main/result/result.component';
import {DataLoadComponent} from './main/hit-page/data-load/data-load.component';

const appRoutes = [
  {path: 'import', component: ImporterComponent},
  {path: 'settings', component: SettingsComponent, children: [
      {path: 'context/new', component: EditContextComponent},
      {path: 'context/:id', component: EditContextComponent}
    ]},
  {path: '', component: MainComponent, children: [
      {path: '', component: StartPageComponent, pathMatch: 'full'},
      {path: 'r', component: ResultComponent},
      {path: 'r/:id', component: HitPageComponent},
      {path: 'r/:id/import', component: DataLoadComponent},
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
