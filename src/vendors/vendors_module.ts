import {MatButtonModule} from '@angular/material/button';
import {NgModule} from '@angular/core';

import {Vendors} from './vendors';

@NgModule({
  declarations: [Vendors],
  imports: [MatButtonModule],
})
export class VendorsModule {}
