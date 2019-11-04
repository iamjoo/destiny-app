import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {ApiService} from '../api/api';

import {AppComponent} from './app_component';
import {Routing} from '../routing/routing';
import {RoutingModule} from '../routing/routing_module';
import {Vendors} from '../vendors/vendors';

@NgModule({
  declarations: [
    AppComponent,
    Routing,
    Vendors,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RoutingModule,
  ],
  providers: [
    ApiService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
