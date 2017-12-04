import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { NetworkService } from './network.service';
import {
  GameField,
  Ship,
  GameFieldPosition,
  State,
  Placeholder
} from './models';
import { GameFieldDrawer } from './GameFieldCanvas';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  placeholder: Placeholder = Placeholder.standard;
  state: State = State.setupGameField;
  subscription: any;
  playerGameField: GameField;
  beInLine: boolean;
  hideGameFields = true;
  setupGameFieldFinished: Boolean = false;
  playerFieldDrawer: GameFieldDrawer;
  opponenGameFieldDrawer: GameFieldDrawer;

  isOpponentReady = false;

  constructor(public networkService: NetworkService) {
    console.log('constructor');
  }

  ngOnInit() {
    this.subscription = this.networkService
      .getMessageEmitter()
      .subscribe(this.parseMessage.bind(this));
    this.playerGameField = new GameField();
    this.playerFieldDrawer = new GameFieldDrawer('playerCanvas', test => {});
    this.opponenGameFieldDrawer = new GameFieldDrawer(
      'opponentCanvas',
      this.opponentGameFieldClickCallback.bind(this)
    );
    this.opponenGameFieldDrawer.setHoveringEnabled(false);
    this.setupInitialGameField();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  parseMessage(message) {
    switch (message.type) {
      case 'Connected':
        this.hideGameFields = false;
        this.state = State.setupGameField;
        break;
      case 'Ready':
        this.isOpponentReady = true;
        break;
      case 'RequestHit':
        const pos = message.payload;
        this.handleHitRequest(pos);
        break;
      case 'Hit':
        this.opponenGameFieldDrawer.drawShipHitAtIndex(
          message.payload.x,
          message.payload.y,
          false,
          message.payload.index
        );
        break;
      case 'Miss':
        this.opponenGameFieldDrawer.drawShipMissAtIndex(
          message.payload.x,
          message.payload.y
        );
        break;
      case 'ShipSunk':
        const payload = JSON.parse(message.payload);
        for (const pos1 of JSON.parse(message.payload).ships) {
          this.opponenGameFieldDrawer.drawShipHitAtIndex(
            pos1.x,
            pos1.y,
            true,
            payload.index
          );
        }
        const shipSunkSound = document.getElementsByTagName('audio')[0];
        shipSunkSound.play();

        break;
      case 'GameEnd':
        this.placeholder = Placeholder.win;
        this.reset();
        this.disconnect();
        break;
      case 'EndGameManually':
        this.placeholder = Placeholder.standard;
        this.reset();
        this.disconnect();
        break;
      default:
        console.log(
          'wrong action structur -> no type defined : ' +
            JSON.stringify(message)
        );
        break;
    }
  }

  playerNameChange(event) {
    this.networkService.changePlayerName(event.target.value);
  }

  playWith(player) {
    this.networkService.connectToEnemy(player);
    this.hideGameFields = false;
  }

  sendToOpponent(action, state = State.waiting) {
    this.changeStateTo(state);
    this.networkService.sendMessage(action);
    if (action.type === 'GameEnd') {
      this.reset();
    }
  }

  finishedSetup() {
    this.playerFieldDrawer.setHoveringEnabled(false);
    if (this.isOpponentReady) {
      this.changeStateTo(State.beInLine);
      this.setupGameFieldFinished = true;
    } else {
      const action = {
        type: 'Ready',
        payload: ''
      };
      this.setupGameFieldFinished = true;
      this.sendToOpponent(action);
      this.opponenGameFieldDrawer.showTurnIndicator();
    }
  }

  reset() {
    this.hideGameFields = true;
    this.setupGameFieldFinished = false;
    this.isOpponentReady = false;
    this.playerGameField = new GameField();
    this.playerFieldDrawer.clearField();
    this.opponenGameFieldDrawer.clearField();
    this.opponenGameFieldDrawer.setHoveringEnabled(false);
    this.playerFieldDrawer.hideTurnIndicator();
    this.opponenGameFieldDrawer.hideTurnIndicator();
    this.setupInitialGameField();
  }

  opponentGameFieldClickCallback(click) {
    if (this.state === State.beInLine) {
      const action = {
        type: 'RequestHit',
        payload: {
          x: click.x,
          y: click.y
        }
      };
      this.sendToOpponent(action);
    }
  }

  changeStateTo(state: State) {
    switch (state) {
      case State.beInLine:
        this.playerFieldDrawer.showTurnIndicator();
        this.opponenGameFieldDrawer.hideTurnIndicator();
        this.opponenGameFieldDrawer.setHoveringEnabled(true);
        this.state = state;
        break;
      case State.waiting:
        this.playerFieldDrawer.hideTurnIndicator();
        this.opponenGameFieldDrawer.showTurnIndicator();
        this.opponenGameFieldDrawer.setHoveringEnabled(false);
        this.state = state;
        break;
      default:
        console.log('Something went wrong while state changing to: ' + state);
    }
  }

  handleHitRequest(pos) {
    const index = this.playerGameField.field[pos.x][pos.y].index;
    const action = {
      type: '',
      payload: undefined
    };
    if (index !== -1) {
      // hit
      const isSunk = this.playerGameField.ships[index].setPosToHitted(pos);
      if (isSunk) {
        // ship is sunk
        const shipSunkSound = document.getElementsByTagName('audio')[0];
        shipSunkSound.play();

        const gameHasEnded = this.checkGameEnds();
        if (gameHasEnded) {
          action.type = 'GameEnd';
          this.placeholder = Placeholder.loose;
        } else {
          action.type = 'ShipSunk';
          action.payload = JSON.stringify({
            ships: this.playerGameField.ships[index].positions,
            index: index
          });
          for (const pos1 of this.playerGameField.ships[index].positions) {
            this.playerFieldDrawer.drawShipHitAtIndex(
              pos1.x,
              pos1.y,
              true,
              index
            );
          }
        }
      } else {
        // normal hit
        action.type = 'Hit';
        action.payload = {
          x: pos.x,
          y: pos.y,
          index: index
        };
        this.playerFieldDrawer.drawShipHitAtIndex(pos.x, pos.y, false, index);
      }
    } else {
      // miss
      action.type = 'Miss';
      action.payload = {
        x: pos.x,
        y: pos.y
      };
      this.playerFieldDrawer.drawShipMissAtIndex(pos.x, pos.y);
    }
    this.sendToOpponent(action, State.beInLine);
  }

  checkGameEnds() {
    let allShipsAreSunk = true;
    for (const ship of this.playerGameField.ships) {
      if (!ship.isSunk) {
        allShipsAreSunk = false;
        break;
      }
    }
    return allShipsAreSunk;
  }

  endGameManually() {
    this.placeholder = Placeholder.standard;
    this.reset();
    const action = {
      type: 'EndGameManually',
    };
    this.sendToOpponent(action);
  }

  disconnect() {
    this.networkService.closeConnectionToEnemy();
  }

  @HostListener('window:beforeunload', ['$event'])
  public beforeunloadHandler($event) {
    this.networkService.unregister();
    return 'nothing';
  }

  setupInitialGameField() {
    this.state = State.setupGameField;

    const battleship = new Ship();
    battleship.positions = [
      new GameFieldPosition(0, 0),
      new GameFieldPosition(1, 0),
      new GameFieldPosition(2, 0),
      new GameFieldPosition(3, 0)
    ];

    const cruiser = new Ship();
    cruiser.positions = [
      new GameFieldPosition(0, 1),
      new GameFieldPosition(1, 1),
      new GameFieldPosition(2, 1)
    ];
    const cruiser2 = new Ship();
    cruiser2.positions = [
      new GameFieldPosition(4, 1),
      new GameFieldPosition(5, 1),
      new GameFieldPosition(6, 1)
    ];

    const destroyer = new Ship();
    destroyer.positions = [
      new GameFieldPosition(0, 2),
      new GameFieldPosition(1, 2)
    ];
    const destroyer2 = new Ship();
    destroyer2.positions = [
      new GameFieldPosition(4, 2),
      new GameFieldPosition(5, 2)
    ];
    const destroyer3 = new Ship();
    destroyer3.positions = [
      new GameFieldPosition(7, 2),
      new GameFieldPosition(8, 2)
    ];

    const submarine = new Ship();
    submarine.positions = [new GameFieldPosition(0, 3)];
    const submarine2 = new Ship();
    submarine2.positions = [new GameFieldPosition(2, 3)];
    const submarine3 = new Ship();
    submarine3.positions = [new GameFieldPosition(4, 3)];
    const submarine4 = new Ship();
    submarine4.positions = [new GameFieldPosition(6, 3)];

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
      for (const position of ship.positions) {
        this.playerGameField.field[position.x][position.y].index = index;
        this.playerFieldDrawer.drawShipAtIndex(position.x, position.y, index);
      }
    });
  }
}
