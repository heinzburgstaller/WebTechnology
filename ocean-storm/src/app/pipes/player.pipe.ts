import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Pipe({ name: 'playerPipe' })
export class PlayerPipe implements PipeTransform {

  transform(players: any[], myPeerId: string): any[] {
    if (!players) {
      return [];
    }
    return players.filter(player => {
      return player.peerId !== myPeerId && player.isPlaying === false;
    });
  }

}
