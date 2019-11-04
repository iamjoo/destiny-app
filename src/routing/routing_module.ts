import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {Routing} from './routing';
import {Vendors} from '../vendors/vendors';

const routes: Routes = [
  {path: 'vendors', component: Vendors},
  {path: 'routing', component: Routing},
  {path: '', redirectTo: 'vendors', pathMatch: 'full'},
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes, {enableTracing: false})],
  exports: [RouterModule],
})
export class RoutingModule {}

// https://tolocalhost.com/?code=f259e87570b3a3f6de2b0751aba4f86d&state=someState
