import  firebase from 'firebase';
import '@firebase/auth';
import '@firebase/firestore';
//import '@firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyABw0mq-7eopj9-we2cjCV1K420M63odQU',
  authDomain: 'learningfirebase-f67dc.firebaseapp.com',
  databaseURL: 'https://learningfirebase-f67dc-default-rtdb.firebaseio.com/',
  projectId: 'learningfirebase-f67dc',
  storageBucket: 'learningfirebase-f67dc.appspot.com',
  messagingSenderId: '546144812543',
  appId: '1:546144812543:ios:ab22b5cfd9fe214bb1fbca',
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export { firebase };