import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { NetworkService } from './network.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  subscription: any;

  constructor(private networkService: NetworkService) {

  }

  ngOnInit() {
    this.subscription = this.networkService.getMessageEmitter()
      .subscribe(message => {
        console.log(message);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  playerNameChange(event) {
    this.networkService.changePlayerName(event.target.value);
  }

  playWith(player) {
    this.networkService.connectToEnemy(player);
  }

  sendSomething() {
    this.networkService.sendMessage({ message: 'Hello!!!', date: new Date() });
  }

  disconnect() {
    this.networkService.closeConnectionToEnemy();
  }

  @HostListener('window:beforeunload', ['$event'])
  public beforeunloadHandler($event) {
    this.networkService.unregister();
    return 'nothing';
  }

}
