import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';

@Component({
  selector: 'authz',
  template: `<div>Authz</div>`,
})
export class Authz implements OnInit {
  constructor(private readonly location: Location) {}

  ngOnInit(): void {
    window.addEventListener('message', (e) => this.sendCode(e));
  }

  private sendCode(event: MessageEvent): void {
    const path = this.location.path();
    const startIndex = path.indexOf('?');

    let code = '';
    let state = '';
    if (path && startIndex) {
      code = new URLSearchParams(path.substring(startIndex)).get('code');
      state = new URLSearchParams(path.substring(startIndex)).get('state');
    }

    console.log(`code: ${code}`);
    console.log(`state: ${state}`);
    console.log(event.origin);
    (event.source as WindowProxy).postMessage({state, code}, event.origin);
  }
}
