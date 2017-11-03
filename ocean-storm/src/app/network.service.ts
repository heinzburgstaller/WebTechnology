import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import 'rxjs/add/operator/map';

import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';


export class Player { name: string; peerId: any; }

@Injectable()
export class NetworkService {

  static readonly PEER_JS_API_KEY = 'bzwelzt8iihn0zfr';

  public peer;
  public peerId;
  private playersCollection: AngularFirestoreCollection<any>;
  public players: Observable<any[]>;
  sub;

  constructor(private db: AngularFirestore) {
    this.playersCollection = db.collection<Player>('players');
    this.players = this.playersCollection.valueChanges();
    this.peer = new Peer({ key: NetworkService.PEER_JS_API_KEY });
    this.peer.on('open', (id) => {
      this.peerId = id;
    });

    TimerObservable
      .create(2500, 1000).subscribe(() => {
        console.log(this.peerId);
        let index = 1;
        let i = 0;
        let p:Observable<any[]> = this.players.filter(player => true);
        p.map(element => {
          console.log(element);
        });

        //console.log(p);
      });
  }

  public addPlayer(player: Player) {
    this.playersCollection.add(player);
  }

  public onOpen(id) {

  }

}
