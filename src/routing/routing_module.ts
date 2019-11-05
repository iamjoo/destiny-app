import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {Routing} from './routing';
import {Vendors} from '../vendors/vendors';

const routes: Routes = [
  {path: 'vendors', component: Vendors},
  {path: 'routing', component: Routing},
  {path: '', redirectTo: 'vendors', pathMatch: 'full'},
  {path: '**', redirectTo: 'vendors', pathMatch: 'full'},
];

@NgModule({
  declarations: [Routing],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class RoutingModule {}
