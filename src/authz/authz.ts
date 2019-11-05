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
    const sourceWindow = event.source as WindowProxy;
    if (!event.origin.startsWith('https://iamjoo.github.io') &&
        !event.origin.startsWith('http://localhost:4200')) {
      console.warn(`origin is different: [${event.origin}]`);
      sourceWindow.postMessage({state: ''}, event.origin);
      return;
    }

    const path = this.location.path();
    const startIndex = path.indexOf('?');
    if (!path || !startIndex) {
      sourceWindow.postMessage({state: ''}, event.origin);
      return;
    }

    const code = new URLSearchParams(path.substring(startIndex)).get('code');
    const state = new URLSearchParams(path.substring(startIndex)).get('state');
    sourceWindow.postMessage({state, code}, event.origin);
  }
}
