export const environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyA_RRCEzF5peOAM2tAWpvdrBWeruN8HjDo',
    authDomain: 'ocean-storm-firebase.firebaseapp.com',
    databaseURL: 'https://ocean-storm-firebase.firebaseio.com',
    projectId: 'ocean-storm-firebase',
    storageBucket: '',
    messagingSenderId: '241674155722'
  },
  peerJS: {
    key: 'bzwelzt8iihn0zfr',
    config: {
      'iceServers': [
        { url: 'stun:stun4.l.google.com:19302' },
        {
          url: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
        }
      ]
    }
  }
};
