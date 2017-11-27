import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { NetworkService } from './network.service';
import { GameField, Ship, GameFieldPosition, State } from './models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {

  state: State;
  subscription: any;
  gameField: GameField;
  beInLine: boolean;

  constructor(private networkService: NetworkService) {
    this.state = State.setupGameField;

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
        console.log("received msg: " + JSON.stringify(message));
        this.state = State.beInLine;
        const action = {
          type: 'changeState',
          payload: State.waiting,
        };
        this.sendToEnemy(action);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  playerNameChange(event) {
    this.networkService.changePlayerName(event.target.value);
  }

  playWith(player) {
    this.networkService.connectToEnemy(player.peerId);
  }

  sendToEnemy(action) {
    this.state = State.waiting;
    this.networkService.sendMessage(action);
  }

  sendSomething(){
    this.sendToEnemy({"test": "asdfwe"});
  }

  @HostListener('window:beforeunload', ['$event'])
  public beforeunloadHandler($event) {
    this.networkService.unregister();
    return 'nothing';
  }

}

