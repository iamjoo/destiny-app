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
    console.log(event.origin);
    if (!event.origin.startsWith('https://iamjoo.github.io/destiny-app/')) {
      return;
    }

    const path = this.location.path();
    const startIndex = path.indexOf('?');
    if (!path || !startIndex) {
      return;
    }

    const code = new URLSearchParams(path.substring(startIndex)).get('code');
    const state = new URLSearchParams(path.substring(startIndex)).get('state');
    (event.source as WindowProxy).postMessage({state, code}, event.origin);
  }
}
