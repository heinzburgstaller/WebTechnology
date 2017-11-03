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
      return changes.map(c => ({ key: c.payload.key, ...c.payload.val() }));
    });

    this.peer = new Peer({ key: NetworkService.PEER_JS_API_KEY });
    this.peer.on('open', (id) => {
      this.peerId = id;
      this.addItem('PlayerX', id, false);
    });

    TimerObservable
      .create(2500, 1000).subscribe(() => {
        console.log(this.peerId);
      });
  }

  addItem(name: string, peerId: any, isPlaying: boolean) {
    this.playersRef.push({ name: name, peerId: peerId, isPlaying: isPlaying });
  }
  updateItem(key: string, name: string, isPlaying: boolean) {
    this.playersRef.update(key, { name: name, isPlaying: isPlaying });
  }
  deleteItem(key: string) {
    this.playersRef.remove(key);
  }
  deleteEverything() {
    this.playersRef.remove();
  }

}
