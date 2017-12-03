import GameFieldPosition from './GameFieldPosition';

export default class Ship {
  positions: GameFieldPosition[];
  isSunk: boolean;
  constructor(){
    this.positions = [];
    this.isSunk = false;
  }

  setPosToHitted(pos){
    var isSunk = true;
    for(const entry of this.positions){
      if(entry.x === pos.x && entry.y === pos.y){
        entry.isHitted = true;
      }
      else{
        if(!entry.isHitted){
          isSunk = false;
        }
      }
    }
    this.isSunk = isSunk;
    return isSunk;
  }
}