import { Component, HostListener } from '@angular/core';
import { NetworkService } from './network.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  constructor(private networkService: NetworkService) {

  }

  playerNameChange(event) {
    this.networkService.changePlayerName(event.target.value);
  }

  @HostListener('window:beforeunload', ['$event'])
  public beforeunloadHandler($event) {
    this.networkService.unregister();
    $event.returnValue = 'false';
    return false;
  }


}
