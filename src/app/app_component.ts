import {Component} from '@angular/core';
import {NavigationExtras, Router} from '@angular/router';
import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';

const navExtras: NavigationExtras = {
  queryParamsHandling: 'preserve',
  preserveFragment: true,
};

@Component({
  selector: 'app-root',
  providers: [
    Location,
    {provide: LocationStrategy, useClass: PathLocationStrategy},
  ],
  templateUrl: './app_component.ng.html',
})
export class AppComponent {
  constructor(location: Location, router: Router) {
    // const path = location.path();
    // console.log(path);

    // if (path) {
    //   const searchParams = new URLSearchParams(path);
    //   const code = searchParams.get('code');
    //   console.log(code);

    //   if (code) {
    //     // do something with it
    //   }
    // }

    console.log('app component loaded');
    // router.navigate(['vendors'], navExtras);
    // router.navigateByUrl('/vendors', navExtras);
  }
}
