import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { NetworkService } from './network.service';
import { GameField, Ship, GameFieldPosition, State } from './models';
import { GameFieldDrawer } from './GameFieldCanvas';
import { Subscription } from 'rxjs/Subscription';
import { Message } from './models/message';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  state: State;
  subscription: Subscription;
  gameField: GameField;
  beInLine: boolean;

  constructor(public networkService: NetworkService) {

    this.gameField = new GameField();
    this.gameField.field[0][0].index = 0;
    this.gameField.field[0][1].index = 0;
    this.gameField.field[0][2].index = 0;

    const ship = new Ship();
    ship.positions = [
      new GameFieldPosition(0, 0),
      new GameFieldPosition(0, 1),
      new GameFieldPosition(0, 2)
    ];

    this.gameField.ships = [ship];
    this.state = State.waiting;
  }

  ngOnInit() {
    this.subscription = this.networkService.getMessageEmitter()
      .subscribe(message => {
        console.log(message);

        switch (message.type) {
          case Message.TYPE_CONNECTION_ESTABLISHED:
            console.log('Yeah');
            break;

          default:
            break;
        }
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


  sendToEnemy(action) {
    this.state = State.waiting;
    this.networkService.sendMessage(action);
  }

  sendSomething() {
    this.sendToEnemy({ "test": "asdfwe" });
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
