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

  player: NetworkService;

  constructor(public networkService: NetworkService) {
    console.log('constructor');
  }

  ngOnInit() {
    this.subscription = this.networkService
      .getMessageEmitter()
      .subscribe(this.parseMessage.bind(this));
    this.playerGameField = new GameField();
    this.playerFieldDrawer = new GameFieldDrawer(
      'playerCanvas',
      null,
      this.isNewPosValid.bind(this),
      this.getShipIndex.bind(this)
    );
    this.opponenGameFieldDrawer = new GameFieldDrawer(
      'opponentCanvas',
      this.opponentGameFieldClickCallback.bind(this),
      this.isNewPosValid.bind(this),
      this.getShipIndex.bind(this)
    );
    this.opponenGameFieldDrawer.setHoveringEnabled(false);
    this.setupInitialGameField();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  //Dummy Data, needed for Firefox
  onDragStart(event, data) {
    event.dataTransfer.setData('data', data);
    this.player = data;
  }

  allowDrop(ev) {
    ev.preventDefault();
  }


  drop(ev) {
    this.playWith(this.player);
  }


  /////
  // parse message from peer connection
  // basic game logic is included
  ////
  parseMessage(message) {
    switch (message.type) {
      case 'Connected':
        console.log('connected to other player');
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

  /////
  // handle name change in networkService class
  ////
  playerNameChange(event) {
    this.networkService.changePlayerName(event.target.value);
  }

  /////
  // set up connection to chosen player in view
  ////
  playWith(player) {
    this.networkService.connectToEnemy(player);
    this.hideGameFields = false;
  }

  /////
  // wrapper for sending message to opponent for state handling
  // send action/message to enemy
  ////
  sendToOpponent(action, state = State.waiting) {
    this.changeStateTo(state);
    this.networkService.sendMessage(action);
    if (action.type === 'GameEnd') {
      this.reset();
    }
  }

  /////
  // prepare start game for this player
  // notify enemy that this player is ready
  ////
  finishedSetup() {
    this.playerFieldDrawer.setHoveringEnabled(false);
    this.opponenGameFieldDrawer.setSetUpFinished();
    this.playerFieldDrawer.setSetUpFinished();
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

  /////
  // reset to initial state
  ////
  reset() {
    this.hideGameFields = true;
    this.setupGameFieldFinished = false;
    this.isOpponentReady = false;
    this.state = State.setupGameField;
    this.playerGameField = new GameField();
    this.playerFieldDrawer.clearField();
    this.opponenGameFieldDrawer.clearField();
    this.opponenGameFieldDrawer.setHoveringEnabled(false);
    this.playerFieldDrawer.hideTurnIndicator();
    this.opponenGameFieldDrawer.hideTurnIndicator();
    this.setupInitialGameField();
  }

  /*  playerGameFieldClickCallback(cells){
      this.playerGameField.ships = [];
      for (let i = 0; i < this.playerGameField.field.length; i++) {
        const line = cells[i];
        for (let j = 0; j < this.playerGameField.field.length; j++) {
          this.playerGameField.field[i][j].index = cells[i][j].shipIndex;
          if(cells[i][j].shipIndex != -1){
            //this.playerGameField.ships[cells[i][j].shipIndex-1].positions.push(new GameFieldPosition(i,j));
            console.log(this.playerGameField.ships);
          }
        }
      }
    }*/

  /////
  // callback for clicks on gamefield
  // create and send action to enemy
  ////
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

  /////
  // callback for ship index
  // returns ship index which is on a certain positio
  ////
  getShipIndex(position: GameFieldPosition) {
    this.playerGameField.ships.forEach((ship, index) => {
      ship.positions.forEach(pos => {
        if (pos.x === position.x && pos.y === position.y) {
          return index;
        }
      });
    });
    return -1;
  }

  /////
  // callback for change ship position
  // check if pos is valid and if yes, gameField gets updated
  ////
  isNewPosValid(index, positions: GameFieldPosition[]) {

    if(!positions){
      return [false, this.playerGameField.field];
    }

    var ok = true;
    positions.forEach(pos => {
      if (this.playerGameField.field[pos.x][pos.y].index > -1
      && this.playerGameField.field[pos.x][pos.y].index != index) {
        ok = false;
      }
    });
    if (!ok) return [false, this.playerGameField.field];

    //remove old position:
    for(var i = 0; i < this.playerGameField.field.length; i++) {
      var line = this.playerGameField.field[i];
      for(var j = 0; j < line.length; j++) {
        if(line[j].index == index)
          line[j].index = -1;
      }
    }
    // update playergamefield and ships
    positions.forEach(pos => {
      this.playerGameField.field[pos.x][pos.y].index = index;
    });
    this.playerGameField.ships[index].positions = positions;

    return [true, this.playerGameField.field];
  }

  /////
  // change class state to `state`
  ////
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

  /////
  // check enemy hit or miss
  // notify enemy with `hit`, `miss`, `shipSunk` and `gameEnd`
  ////
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

  /////
  // checks if all ships are sunk
  ////
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

  /////
  // close connection and notify enemy
  ////
  endGameManually() {
    this.placeholder = Placeholder.standard;
    this.reset();
    const action = {
      type: 'EndGameManually'
    };
    this.sendToOpponent(action);
  }

  /////
  // close peerConnection to enemy
  ////
  disconnect() {
    this.networkService.closeConnectionToEnemy();
  }

  @HostListener('window:beforeunload', ['$event'])
  public beforeunloadHandler($event) {
    this.networkService.unregister();
    return 'nothing';
  }

  /////
  // add all ships to gamefield and set state to `setupGameField`
  ////
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
