import Entry from './Entry';
import Ship from './Ship';

export default class GameField {
  field: Entry[][];
  ships: Ship[];
  constructor(){
    this.ships = [];
    this.field = [[]];
    for(var i: number = 0; i < 10; i++) {
      this.field[i] = [];
      for(var j: number = 0; j< 10; j++) {
          this.field[i][j] = new Entry();
      }
    }
  }
}