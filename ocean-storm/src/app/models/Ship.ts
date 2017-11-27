import GameFieldPosition from './GameFieldPosition';

export default class Ship {
  positions: GameFieldPosition[];
  isSunk: boolean;
  constructor(){
    this.positions = [];
    this.isSunk = false;
  }
}