import {Component} from '@angular/core';
import {ApiService} from '../api/api';

@Component({
  selector: 'vendors',
  templateUrl: './vendors.ng.html',
  styleUrls: ['./vendors.scss']
})
export class Vendors {
  authz = this.apiService.getAuthzPath();

  constructor(private readonly apiService: ApiService) {
    console.log('vendors loaded');
  }

  getAccount(): void {
    this.apiService.getAccount();
  }

  getToken(): void {
    this.apiService.getToken();
  }

  getVendors(): void {
    this.apiService.getVendors();
  }
}
