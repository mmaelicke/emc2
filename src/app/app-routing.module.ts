import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MainComponent} from './main/main.component';
import {PageNotFoundComponent} from './generic/page-not-found/page-not-found.component';
import {SettingsComponent} from './settings/settings.component';
import {ImporterComponent} from './importer/importer.component';
import {EditContextComponent} from './settings/context-manager/edit-context/edit-context.component';

const appRoutes = [
  {path: 'import', component: ImporterComponent},
  {path: 'settings', component: SettingsComponent, children: [
      {path: 'context/new', component: EditContextComponent},
      {path: 'context/:id', component: EditContextComponent}
    ]},
  {path: '', component: MainComponent, pathMath: 'full'},
  {path: '**', component: PageNotFoundComponent}
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {useHash: false})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
