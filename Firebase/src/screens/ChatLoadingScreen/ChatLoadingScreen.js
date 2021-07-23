// imports here
import React, { useContext, useEffect, useState } from 'react'
import { FlatList, Text, TextInput, Touchable, TouchableOpacity, View, Keyboard } from 'react-native'
import styles from './styles';
import { firebase } from '../../firebase/config'
import { UserContext } from '../../contexts/Context.js';
/*
How I want this to work for now:
    1. Bob requests to chat with Alice
    2. Bob's App waits for a similar request from Alice
    3. Upon receiving her request, they are both moved into the chat window, which ends when one of them exits.

    Functionality to implement later: //Look into Firebase functions for some of these things.
        1. Asynchronous chatting - Alice and Bob can chat when the other isn't online
        2. Chat invitations - some sort of screen popup upon login? - definitely look into this
        3. Forced redirect to chat window - Alice requests to chat, Bob takes a while to respond to invitation. 
                                            - when he does, the chat screen opens for both of them
*/

 export default function ChatLoadingScreen(props){ //props is included for the navigation and route props
    const user = useContext(UserContext); //allows us to get the userID
    const [conversations, setConversations] = useState([]); //similar to the HomeScreen code
    const [requests, setRequests] = useState([]); //similar to the HomeScreen code
    const [invitee, setInvitee] = useState("") //Invitee being the person invited to chat
    const [emailExists, setEmailExists] = useState(false);
    const userID = user.id; 
    const userEmail = user.email;

    /*
    For each request logged, we go through and check if we are requested. 
    Each request for us to chat is listed for us (entity style)
    Clicking on a request takes us to the chat page. 

    Possible procedure (this may allow for asynchronous chatting):
        1. Bob requests to chat. This request is stored in a request document
        2. Alice's app checks if someone wants to chat in the useEffect loop 
            2a. This is stored in a request collection that contains the user sending the request and the intended recipient.
            2b. If she accepts, it creates a new conversation.
            2c. If one already exists, she can chat in it without having to accept again. 
    */

    //TODO: add checks to ensure only 1 invite is created per user pair, that only 1 conversation exists between users
    const conversationRef = firebase.firestore().collection('Conversations'); //this creates a reference to the Conversations collection
    const inviteRef = firebase.firestore().collection('Invites'); // creates a reference to the Invites collection
    const userRef = firebase.firestore().collection('users').doc(userID); // creates a reference to the user's document
    

   useEffect(()=> { //We'll use this to load any existing conversations and invites
        //We go through every conversation included in the two Conversations queries above and add their data to an array 
        const firstConversationRef = conversationRef.where("firstAuthorEmail", "==", userEmail); //Firestore doesn't have logical OR for queries, so I have to do two separate ones.
        const secondConversationRef = conversationRef.where("secondAuthorEmail", "==", userEmail);//These queries check for conversations that involve our user. 
        const conversationRefArray = [firstConversationRef,secondConversationRef]; //more flexible. We can add Refs to the array if ever necessary
        conversationRefArray.forEach(conversations =>{ 
            conversations //currently, this is giving me each conversation twice because firstAuthorEmail and secondAuthorEmail are the same at the moment. 
            .orderBy("lastUpdate","desc")
            .onSnapshot(
            querySnapshot => {  //all of this code is similar to the HomeScreen code. 
                let newConversations = [];
                querySnapshot.forEach(doc => { 
                     const conversation  = doc.data(); 
                     conversation.id = doc.id;
                     const checkId=(identification, array)=>{ 
                         const contains = false;//this function checks if a specific conversation is already in the array to avoid duplicates when we chat with ourselves
                         array.forEach((document)=>{
                             if(document.id == identification){
                                 contains = true;
                             }      
                         })
                         return contains;
                     }
                     if(!checkId(conversation.id, newConversations) === true){ //the above checkId function is utilized here
                     newConversations.push(conversation);
                     }
                })
                //setConversations(oldConversations);
                setConversations(newConversations) 
                 //alert(conversations.length);
            }, error => {
                alert(error);
            }
        )});
        inviteRef.where("recipientEmail", "==", userEmail) // this does pretty much the same thing as the above, but with invites. 
        .orderBy("createdAt", "desc")
        .onSnapshot(
            querySnapshot => {
              let inviteList = [];
                querySnapshot.forEach(doc =>{
                    const invite = doc.data();
                    invite.id = doc.id;
                    inviteList.push(invite);
                })
                setRequests(inviteList);
            }, error => {
                alert(error)
            }
        )
   },[]);
   /*
   The next useEffect() loop is a workaround to an issue I was having. I wanted to invite people by email address
   instead of userName (because I don't have userNames in this code), and so before creating the invite, I wanted to 
   check that it was valid. However, that code reads data from a server, which is asynchronous. So, I created a useEffect loop 
   just for it. 

   Another solution would probably be to return a promise from checkEmail and have that resolve in the onCreateInviteButtonPress 
   function. I'll work on implementing that later. It would have the advantage of not fetching data every keystroke. The free plan
   only allows us 50000 reads a day. 
   */
   useEffect(()=>{
    checkEmail(invitee).then((value)=>setEmailExists(value)); 
   },[invitee]); //whenever invitee changes, we run the checkEmail function (near the bottom of the code). 
                
   

   //We've loaded the possible messages and potential invites we can accept. Let's add methods that create them:

    function onCreateInviteButtonPress(){ //as best as I can tell, I've gotten this to work.
        if(emailExists){ //A boolean variable that is modified in the above effect loop with the checkEmail function
            const timestamp = firebase.firestore.FieldValue.serverTimestamp(); 
            const data = {//creates the invite.
                recipientEmail: invitee,  //I'm actually going to have the invite be made with emails instead of ids. 
                authorEmail: userEmail,
                createdAt: timestamp,
            };
            inviteRef //adds our invite to the collection. 
                .add(data) //Right now, I'm getting an error with one of the .add calls in this file. 
                .then(_doc => {
                    userRef.collection('chatPartners').add({partner: invitee, status: "invite"}).catch((error)=>console.log(error)); //it may make sense to store the list of partners in a single doc.
                    //I think that you can do that with the json fileDatabase that firebase provides. 
                    setInvitee('') //resets the text entry field for a new entity.
                    Keyboard.dismiss() //gets rid of the keyboard popup.
                })
                .catch((error) => {
                    alert(error)
                });
        }
        else{
            alert("Email not found: "+invitee);//invitee ensures that the email is not undefined. Mainly for troubleshooting.
        }
   }

   /*
   I'm still a bit hazy on how I want to create conversations. Do I want them to have the userID's or emails of both users?
   How do I update the timestamp when they get modified? 
   I think the details will become clearer as I work with this. 
   */
   const onAcceptInviteButtonPress = (inviteData) =>{ //code for accepting invites handler function
        //first, we create a conversation with the two users 
        const firstUser = inviteData.recipientEmail;
        const secondUser = inviteData.authorEmail;
        const inviteID = inviteData.id;

        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        const data = {
            firstAuthorEmail: firstUser,
            secondAuthorEmail: secondUser,
            lastUpdate: timestamp,
            metadata: {
                inviteID: inviteID //the doc id of the invite this conversation is made from
            } 
        }
        conversationRef
        .add(data)
        .then((doc)=>{
            userRef.collection('chatPartners').add({partner: secondUser, status: "converse"}).catch((error)=>console.log(error));
            const conversationID = doc.id;
            props.navigation.navigate('Chat Screen', {conversationID: conversationID})
            inviteRef.doc(inviteID).delete();
        } )
        .catch((error)=>alert(error)) //
                                      
   
      
   /*conversationID is included to access the conversation
   in the chat screen. I had this idea after I created the chat screen, so I haven't implemented it there yet. One screen at a time.*/
    }
        /*
            Erroneous Behavior: 
                1. The chatloadingscreen starts with 2 conversations without any conversation or author information.
                    1b. Even if I delete all existing conversations, the problem persists.
                    2b. The two conversations rendered don't show up in the database though. 
                    3b. Looping thru the conversationRef arr one more time creates another conversation box.
                2. The chatloadingscreen immediately redirects to the chatscreen, throwing the alert "something was pressed" twice
                3. Returning to the chatloading screen causes 2. to happen again. 
                4. Returning to the chatloading screen again works.

                RESOLVED part 1: The issue was that the [...prev, oldConversations] line in the first useEffect loop added an empty array to the conversations array.
                         Changing it to [...prev, ...oldConversations] seems to have done the trick.
        */
    const onResumeConversationButtonPress = (ID) =>{ //same as above function, but with conversations that already exist
        //for some reason, this code is getting called when it shouldn't be, right at the start of the program.
        alert("something was pressed?")
        props.navigation.navigate('Chat Screen', {conversationID: ID}); 
    }

    const renderConversation = ({index,item})=>{ // I need to fix formating. TouchableOpacity makes each element in the list a button 
        const ID = item.id;
        return(
            <View style={styles.conversationContainer}>
                <TouchableOpacity style={styles.listButton} onPress = {()=>onResumeConversationButtonPress(ID)}> 
                   <Text style = {styles.converstaionText}> {index}. {item.firstAuthorEmail}, {item.secondAuthorEmail}</Text>
                </TouchableOpacity>
            </View>
        )
    }
    const renderInvite = ({index,item})=>{ //almost identical to the above. I don't know why I'm using item instead of invite. 
                return(
            <View style={styles.conversationContainer}>
                <TouchableOpacity style={styles.listButton} onPress = {()=> onAcceptInviteButtonPress(item)}> 
                   <Text style = {styles.conversationText}> {index}. {item.authorEmail}</Text>
                </TouchableOpacity>
            </View>
        )
    }
    const  checkEmail = async (email) =>{ //I kind of have this working. I wish I didn't have to create a useEffect loop just for this though.
        const userRef =  firebase.firestore().collection('users').where("email", "==", email) //max, this should only be one file, so the query shouldn't be too expensive
        let exists = false;
        const querySnapshot = await userRef.get();
        exists = false;
             querySnapshot.forEach(doc =>{
                    exists = true;
                    //alert("email exists:" + exists);
                 // I want to call this outside the snapShot to reset it to false if needed.
            }, error => {alert(error)}
        );
        return exists;
    }
    

   return (
        <View style = {styles.container}>
            <View style = {styles.formContainer}>
                <View style = {styles.columnContainer}>
                    <Text style = {styles.headerText}>Existing Conversations</Text>
                
                    { Boolean(conversations) && (
                    <View style={styles.listContainer}>
                         <FlatList //neeeded to render each element in the list. We probably could have used a for loop as well. 
                        data={conversations}
                        renderItem={renderConversation} //this is called to render each item in the list
                        keyExtractor={(item) => item.id} //this comes from the HomeScreen template. It has something to do with indexing
                        removeClippedSubviews={true} // also came from the homescreen template
                     />
                     </View> )}
                </View>
                <View style = {styles.columnContainer}>
                    <Text style = {styles.headerText}>Pending Invites</Text>
                    { Boolean(requests) && ( //BE CAREFUL WITH INLINE CONDITIONAL FORMATTING. Refer to https://koprowski.it/2020/conditional-rendering-react-native-text-crash/
                    <View style={styles.listContainer}>
                      <FlatList //neeeded to render each element in the list. We probably could have used a for loop as well. 
                        data={requests}
                        renderItem={renderInvite}
                        keyExtractor={(item) => item.id}
                        removeClippedSubviews={true}
                      />
                    </View> )}
                 </View>
                <View style = {styles.columnContainer}>
                    <Text style = {styles.headerText}>Create Invite</Text>
                    <TextInput style={styles.input}
                        placeholder='Add new entity'
                        placeholderTextColor="#aaaaaa"
                        onChangeText={(text) => setInvitee(text)}
                        value={invitee}
                        underlineColorAndroid="transparent"
                        autoCapitalize="none"/>
                    <TouchableOpacity style={styles.button} onPress = {onCreateInviteButtonPress}>
                        <Text style = {styles.buttonText}>Send Invite</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
    

}

