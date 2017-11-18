import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { NetworkService } from './network.service';
import { GameFieldDrawer } from './GameFieldCanvas';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  subscription: any;

  constructor(public networkService: NetworkService) {

  }

  ngOnInit() {
    this.subscription = this.networkService.getMessageEmitter()
      .subscribe(message => {
        console.log(message);
      });

      var playerFieldDrawer = new GameFieldDrawer("playerCanvas");
      var opponenGameFieldDrawer = new GameFieldDrawer("opponentCanvas");
      
      playerFieldDrawer.showTurnIndicator();
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
