export default class GameFieldPosition {
  x: number;
  y: number;
  isHitted: boolean;
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.isHitted = false;
  }
}
