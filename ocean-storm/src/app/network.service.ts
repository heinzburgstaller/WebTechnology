import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';

import { environment } from '../environments/environment';

import 'rxjs/add/operator/map';

@Injectable()
export class NetworkService {
  public peer;
  public peerId;
  public key;
  playersRef: AngularFireList<any>;
  players: Observable<any[]>;
  private enemyConnection = null;
  private messageEmitter: EventEmitter<any> = new EventEmitter();
  public connectedTo: any = null;
  enemyPeerId: string = null;
  connectedToSubscription: any;

  //////
  // init:
  // create NetworkService class with a connection to a Firebase live database
  // connect to the Peer server and set everything up for connection to opponent
  //////
  constructor(private db: AngularFireDatabase) {
    this.playersRef = db.list('players');
    // Use snapshotChanges().map() to store the key
    this.players = this.playersRef.snapshotChanges().map(changes => {
      return changes.map(c => ({
        key: c.payload.key,
        conn: null,
        ...c.payload.val()
      }));
    });

    this.peer = new Peer(environment.peerJS);
    this.peer.on('open', id => {
      this.peerId = id;
      this.key = this.addPlayer('Player', id, false);
    });

    this.peer.on('connection', conn => {
      this.enemyPeerId = conn.peer;
      this.connectedToSubscription = this.players.subscribe(players => {
        this.connectedTo = players.find(
          player => player.peerId === this.enemyPeerId
        );
        this.messageEmitter.emit({ type: 'Connected', payload: '' });
      });
      this.enemyConnection = conn;
      this.playersRef.update(this.key, { isPlaying: true });

      conn.on('data', data => {
        this.messageEmitter.emit(data);
      });

      conn.on('close', () => {
        console.log('Connection closed');
        this.cleanUpConnection();
      });
    });

    this.peer.on('error', error => {
      console.log(error);
      if (error.type === 'peer-unavailable') {
        const n = error.message.split(' ');
        const unPeerId = n[n.length - 1];
        // this.deleteItem(unPeerId);
      }
    });
  }

  //////
  // connect to the player which is passed by parameter
  // save connection an implements `data` and `close` event
  /////
  connectToEnemy(player) {
    this.playersRef.update(this.key, { isPlaying: true });
    this.enemyPeerId = player.peerId;
    this.connectedToSubscription = this.players.subscribe(players => {
      this.connectedTo = players.find(p => p.peerId === this.enemyPeerId);
      this.messageEmitter.emit({ type: 'Connected', payload: '' });
    });
    this.enemyConnection = this.peer.connect(player.peerId);
    this.enemyConnection.on('data', data => {
      this.messageEmitter.emit(data);
    });

    this.enemyConnection.on('close', () => {
      console.log('Connection closed');
      this.cleanUpConnection();
    });
  }

  ////
  // sends message to the active enemy connection
  ////
  sendMessage(message: any) {
    this.enemyConnection.send(message);
  }

  ////
  // add player to firebase database with name, id and isPlaying
  ///
  addPlayer(name: string, peerId: any, isPlaying: boolean) {
    return this.playersRef.push({
      name: name,
      peerId: peerId,
      isPlaying: isPlaying
    }).key;
  }

  /////
  // update the isPlaying state of a player on the live database
  ////
  updatePlayer(key: string, name: string, isPlaying: boolean) {
    this.playersRef.update(key, { name: name, isPlaying: isPlaying });
  }

  /////
  // delete player on firebase live database
  ////
  deletePlayer(key) {
    this.playersRef.remove(key);
  }

  /////
  // change name of player on the live database
  ////
  changePlayerName(newName: string) {
    this.updatePlayer(this.key, newName, false);
  }

  /////
  // terminate the direct connection to the opponent
  ////
  closeConnectionToEnemy() {
    this.enemyConnection.close();
  }

  /////
  // reset to initial state
  ////
  private cleanUpConnection() {
    this.connectedToSubscription.unsubscribe();
    this.enemyPeerId = null;
    this.enemyConnection = null;
    this.connectedTo = null;
    this.playersRef.update(this.key, { isPlaying: false });
  }

  /////
  // remove player from firebase database
  ////
  unregister() {
    this.deletePlayer(this.key);
  }

  getMessageEmitter(): EventEmitter<any> {
    return this.messageEmitter;
  }
}
