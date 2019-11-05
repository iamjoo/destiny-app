import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {MatToolbarModule} from '@angular/material/toolbar';
import {NgModule} from '@angular/core';

import {AppComponent} from './app_component';

import {ApiService} from '../api/api';
import {AuthzModule} from '../authz/authz_module';
import {Routing} from '../routing/routing';
import {RoutingModule} from '../routing/routing_module';
import {Vendors} from '../vendors/vendors';
import {VendorsModule} from '../vendors/vendors_module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    AuthzModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    MatToolbarModule,
    VendorsModule,
    RoutingModule,
  ],
  providers: [
    ApiService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
