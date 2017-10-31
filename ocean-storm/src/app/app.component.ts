import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  peer;
  peerId;

  constructor() {
    this.peer = new Peer({ key: 'bzwelzt8iihn0zfr' });

    this.peer.on('open', function (id) {
      this.peerId = id;
      console.log('My peer ID is: ' + this.peerId);
    });
  }

}
