import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { NetworkService } from './network.service';
import { GameField, Ship, GameFieldPosition, State } from './models';
import { GameFieldDrawer } from './GameFieldCanvas';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {
 
  state: State = State.setupGameField;
  subscription: any;
  playerGameField: GameField;
  beInLine: boolean;
  hideGameFields: boolean = false;//TODO: change to true if callback is implemented
  setupGameFieldFinished: Boolean = false;
  playerFieldDrawer: GameFieldDrawer;
  opponenGameFieldDrawer: GameFieldDrawer;

  isOpponentReady: boolean = false;

  constructor(public networkService: NetworkService) {
    console.log("constructor");
  }

  ngOnInit() {
    this.subscription = this.networkService.getMessageEmitter()
      .subscribe(this.parseMessage.bind(this));
      this.playerGameField = new GameField();
      this.playerFieldDrawer = new GameFieldDrawer("playerCanvas", (test) => {});
      this.opponenGameFieldDrawer = new GameFieldDrawer("opponentCanvas", this.opponentGameFieldClickCallback);
      this.setupInitialGameField();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  parseMessage(message){
    switch(message.type){
      case "connected":
        this.hideGameFields = false;
        this.state = State.setupGameField;
        break;
      case "ready":
        this.isOpponentReady = true;
        this.setupGameFieldFinished = true;
        break;
      default:
        console.log("wrong action structur -> no type defined : " + JSON.stringify(message));
        break;
    }
  }

  playerNameChange(event) {
    this.networkService.changePlayerName(event.target.value);
  }

  playWith(player) {
    this.networkService.connectToEnemy(player);
    this.hideGameFields = false;
    //TODO: put this in a Callback which is fired when the connection is established
    /*this.sendToOpponent(
      {
        "type": 'connected',
        "payload": '',
      },
      State.setupGameField
    );*/
  }

  sendToOpponent(action, state = State.waiting) {
    this.state = state;
    this.networkService.sendMessage(action);
  }

  finishedSetup(){
    if(this.isOpponentReady){
      this.state = State.beInLine;
      this.playerFieldDrawer.showTurnIndicator();
    }
    else{
      const action = {
        type: 'ready',
        payload: '',
      };
      this.setupGameFieldFinished = true;
      this.sendToOpponent(action);
      this.opponenGameFieldDrawer.showTurnIndicator();
    }
  }

  opponentGameFieldClickCallback(click) {
    
  }

  disconnect() {
    this.networkService.closeConnectionToEnemy();
  }

  @HostListener('window:beforeunload', ['$event'])
  public beforeunloadHandler($event) {
    this.networkService.unregister();
    return 'nothing';
  }

  setupInitialGameField(){
    const battleship = new Ship();
    battleship.positions = [
      new GameFieldPosition(0, 0),
      new GameFieldPosition(1, 0),
      new GameFieldPosition(2, 0),
      new GameFieldPosition(3, 0),
    ];

    const cruiser = new Ship();
    cruiser.positions = [
      new GameFieldPosition(0, 1),
      new GameFieldPosition(1, 1),
      new GameFieldPosition(2, 1),
    ];
    const cruiser2 = new Ship();
    cruiser2.positions = [
      new GameFieldPosition(4, 1),
      new GameFieldPosition(5, 1),
      new GameFieldPosition(6, 1),
    ];

    const destroyer = new Ship();
    destroyer.positions = [
      new GameFieldPosition(0, 2),
      new GameFieldPosition(1, 2),
    ];
    const destroyer2 = new Ship();
    destroyer2.positions = [
      new GameFieldPosition(4, 2),
      new GameFieldPosition(5, 2),
    ];
    const destroyer3 = new Ship();
    destroyer3.positions = [
      new GameFieldPosition(7, 2),
      new GameFieldPosition(8, 2),
    ];

    const submarine = new Ship();
    submarine.positions = [
      new GameFieldPosition(0, 3),
    ];
    const submarine2 = new Ship();
    submarine2.positions = [
      new GameFieldPosition(2, 3),
    ];
    const submarine3 = new Ship();
    submarine3.positions = [
      new GameFieldPosition(4, 3),
    ];    
    const submarine4 = new Ship();
    submarine4.positions = [
      new GameFieldPosition(6, 3),
    ];

    this.playerGameField.ships = [
      battleship,
      cruiser,
      cruiser2,
      destroyer,
      destroyer2,
      destroyer3,
      submarine,
      submarine2,
      submarine3,
      submarine4
    ];

    this.playerGameField.ships.forEach((ship, index) => {
      for(const position of ship.positions){
        this.playerGameField.field[position.x][position.y].index = index;
        this.playerFieldDrawer.drawShipAtIndex(position.x, position.y);
      }
    });
  }
}

