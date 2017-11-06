import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';

import 'rxjs/add/operator/map';

@Injectable()
export class NetworkService {

  static readonly PEER_JS_API_KEY = 'bzwelzt8iihn0zfr';

  public peer;
  public peerId;
  public key;
  playersRef: AngularFireList<any>;
  players: Observable<any[]>;
  private enemyConnection = null;
  private messageEmitter: EventEmitter<any> = new EventEmitter();

  constructor(private db: AngularFireDatabase) {
    this.playersRef = db.list('players');
    // Use snapshotChanges().map() to store the key
    this.players = this.playersRef.snapshotChanges().map(changes => {
      return changes.map(c => ({ key: c.payload.key, conn: null, ...c.payload.val() }));
    });

    this.peer = new Peer({ key: NetworkService.PEER_JS_API_KEY });
    this.peer.on('open', (id) => {
      this.peerId = id;
      this.key = this.addPlayer('Player', id, false);
    });

    this.peer.on('connection', (conn) => {
      console.log(conn);
      this.enemyConnection = conn;

      conn.on('data', (data) => {
        this.messageEmitter.emit(data);
      });
    });

    this.peer.on('error', (error) => {
      console.log(error);
      if (error.type === 'peer-unavailable') {
        const n = error.message.split(' ');
        const unPeerId = n[n.length - 1];
        // this.deleteItem(unPeerId);
      }
    });

  }

  connectToEnemy(peerId) {
    this.enemyConnection = this.peer.connect(peerId);
    this.enemyConnection.on('data', (data) => {
      this.messageEmitter.emit(data);
    });
  }

  sendMessage(message: any) {
    this.enemyConnection.send(message);
  }

  addPlayer(name: string, peerId: any, isPlaying: boolean) {
    return this.playersRef.push({ name: name, peerId: peerId, isPlaying: isPlaying }).key;
  }

  updatePlayer(key: string, name: string, isPlaying: boolean) {
    this.playersRef.update(key, { name: name, isPlaying: isPlaying });
  }

  deletePlayer(key) {
    this.playersRef.remove(key);
  }

  changePlayerName(newName: string) {
    this.updatePlayer(this.key, newName, false);
  }

  unregister() {
    this.deletePlayer(this.key);
  }

  getMessageEmitter(): EventEmitter<any> {
    return this.messageEmitter;
  }

}
