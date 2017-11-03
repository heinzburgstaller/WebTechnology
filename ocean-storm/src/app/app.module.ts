import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { AlertModule } from 'ngx-bootstrap/alert';

import { AppComponent } from './app.component';
import { NetworkService } from './network.service';

import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase, 'ocean-storm-firebase'),
    AngularFirestoreModule,
    AlertModule.forRoot(),
    ButtonsModule.forRoot()
  ],
  providers: [NetworkService],
  bootstrap: [AppComponent]
})
export class AppModule { }
