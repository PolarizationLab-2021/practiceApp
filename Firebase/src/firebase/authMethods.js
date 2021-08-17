import { firebase } from './config';
import {decode, encode} from 'base-64'
if (!global.btoa) {  global.btoa = encode } // no clue what these do. Encrypt info sent to firebase?
if (!global.atob) { global.atob = decode }


export  function signIn(email,password){
    firebase
          .auth() //access to the auth library
          .signInWithEmailAndPassword(email, password) //accesses the userID associated with this email and password
          .then((response) => { //returns the user information
            const uid = response.user.uid
            const usersRef = firebase.firestore().collection('users') // this is the collection containing all the userinfo in our database
            usersRef
              .doc(uid) // the user's specific document
              .get() // a promise. Resolves with the user information (UserData)
              .then(firestoreDocument => {
                if (!firestoreDocument.exists) {
                  alert("User does not exist anymore.")
                  return;
                }
                const userData = firestoreDocument.data()
                return userData; 
                alert("Yup. Not hallucinating");
              })
              .catch(error => {
                alert(error)
              });
          })
          .catch(error => {
            alert(error)
          })
} 
export function signOut(){
    firebase.auth()
        .signOut()
        .then(() => {
          return null; // for our setUser function in App.js.
        })
        .catch((error) => {
          alert(error)
        })
}
export function signUp(username, email, password){
    firebase
          .auth() //the authorization library in firebase
          .createUserWithEmailAndPassword(email, password) // a promise that resolves upon doing what it says it will.
          .then((response) => {
            const uid = response.user.uid // the tag specific to each user
            const userData = { // this object will be added to our database collection of users
              id: uid,
              email: email, 
              fullName: fullName,
            };
            const usersRef = firebase.firestore().collection('users') // this will create such a collection if it does not exist.
            usersRef
              .doc(uid) // creates the specific document for that user/
              .set(userData) // sets the user information
              .then(() => {
                return userData; // returns that upon the code resolving.
              })
              .catch((error) => {
                alert(error)
              });
          })
          .catch((error) => {
            alert(error)
          });
        }