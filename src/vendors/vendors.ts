import {Component} from '@angular/core';
import {ApiService} from '../api/api';

@Component({
  selector: 'vendors',
  templateUrl: './vendors.ng.html',
  styleUrls: ['./vendors.scss']
})
export class Vendors {
  constructor(private readonly apiService: ApiService) {
    console.log('vendors loaded');
  }

  getManifest(): void {
    this.apiService.getManifest();
  }

  getVendors(): void {
    this.apiService.getVendors();
  }
}
