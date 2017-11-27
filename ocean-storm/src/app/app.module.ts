import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { AlertModule } from 'ngx-bootstrap/alert';

import { AppComponent } from './app.component';
import { NetworkService } from './network.service';
import { PlayerPipe } from './pipes/player.pipe';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabase } from 'angularfire2/database';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    PlayerPipe
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase, 'ocean-storm-firebase'),
    AlertModule.forRoot(),
    ButtonsModule.forRoot()
  ],
  providers: [AngularFireDatabase, NetworkService],
  bootstrap: [AppComponent]
})
export class AppModule { }
