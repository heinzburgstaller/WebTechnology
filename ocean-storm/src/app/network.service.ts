import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import 'rxjs/add/operator/map';

@Injectable()
export class NetworkService {

  static readonly PEER_JS_API_KEY = 'bzwelzt8iihn0zfr';

  public peer;
  public peerId;
  playersRef: AngularFireList<any>;
  players: Observable<any[]>;

  constructor(private db: AngularFireDatabase) {
    this.playersRef = db.list('players');
    // Use snapshotChanges().map() to store the key
    this.players = this.playersRef.snapshotChanges().map(changes => {
      return changes.map(c => ({ key: c.payload.key, conn: null, ...c.payload.val() }));
    });

    this.peer = new Peer({ key: NetworkService.PEER_JS_API_KEY });
    this.peer.on('open', (id) => {
      this.peerId = id;
      this.addItem('PlayerX', id, false);
    });

    this.peer.on('error', (error) => {
      if (error.type === 'peer-unavailable') {
        const n = error.message.split(' ');
        const unPeerId = n[n.length - 1];
        this.deleteItem(unPeerId);
      }
    });

    TimerObservable
      .create(2500, 2000).subscribe(() => {
        this.players.subscribe(arr => {
          const randomIndex = this.getRandomInt(0, arr.length - 1);
          if (this.peerId === arr[randomIndex].peerId) {
            return;
          }
          if (arr[randomIndex].conn != null) {
            arr[randomIndex].conn.close();
          }
          arr[randomIndex].conn = this.peer.connect(arr[randomIndex].peerId);
        });
      });

  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  addItem(name: string, peerId: any, isPlaying: boolean) {
    this.playersRef.push({ name: name, peerId: peerId, isPlaying: isPlaying });
  }

  updateItem(key: string, name: string, isPlaying: boolean) {
    this.playersRef.update(key, { name: name, isPlaying: isPlaying });
  }

  deleteItem(peerId: string) {
    if (this.peerId === peerId) {
      return;
    }

    this.players.subscribe(arr => {
      const x = arr.filter(
        player => player.peerId === peerId);
      const key = x[0].key;
      this.playersRef.remove(key);
    });
  }

  deleteEverything() {
    this.playersRef.remove();
  }

}
