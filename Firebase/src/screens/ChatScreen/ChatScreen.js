//Imports go here
import React, { useContext, useEffect, useState } from 'react'
import { FlatList, Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native'
import styles from './styles';
import { firebase } from '../../firebase/config'
import { ChatContext, UserContext } from '../../contexts/Context'; 

/*
I don't want to get to fancy with this. I just want to figure out a simple chat implementation.

1. Pair two users. The pairing can be done by request, randomized, or from some criteria. This should be done in another screen (ChatLoadingScreen?).
    1a. I will do it by request right now. 
    1b. Once the pairing is made, go to the chat screen.
2. Load previous conversation between the two users or create one if it doesn't exist. // start here for this page.
    2a. Conversations should be order independent. i.e. Alice talking to Bob is the same as Bob talking to Alice.
    2b. Indicate which user each messages come from. Copy messenger interface (light blue background for own messages?) (opposite sides?)
3. Allow the user to create new messages, which get stored in a conversation array similar to the entities array.
4. Store each conversation in its own doc, with all the messages? Each collection has a set of docs, which in turn can have collections of their own.
    4a. Conversation collection => conversation documents: {fields: author1Id, author2Id, createdAt, numMessages} 
    => message Documents: {fields: authorID, createdAt, text}
*/
export default function ChatScreen(){
const [messageText, setMessageText] = useState('');
const [messages, setMessages] = useState([]);
const {firstUserID, secondUserID} = useContext(ChatContext); //this should be sorted alphabetically when it shows up here. 
const user = useContext(UserContext);
const userID = user.id;

conversationRef = firebase.firestore().collection('Conversations').where("firstAuthorID", "==", firstUserID)
    .where("secondAuthorID", "==", secondUserID);
messageRef = conversationRef.collection('Messages');


useEffect(()=>{
    messageRef.orderBy('CreatedAt', desc)
       .onSnapshot(
           querySnapshot => { 
                messages = []
               querySnapshot.foreach(doc => { 
                    let message  = doc.data
                    message.id = doc.id
                    messages.push(message)
               })
                setMessages(messages)
           }, error => {
               alert(error);
           }
       )
},[])

const onAddButtonPress =()=>{
    if(messageText && messageText.length > 0){
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        const data = {
            text: messageText,
            authorID: userID, //use context to get the userId here
            createdAt: timestamp,
        }
    }
    messageRef
        .add(data)
        .then(_doc => {
            setMessageText('');
            Keyboard.dismiss();
        })
        .catch(error => {
            alert(error);
        });
}

const renderEntity = ({item}) => { //this is called to render each element in the entities list
    return (
        <View style={styles.entityContainer}>
            <Text style={styles.entityText}> 
                 {item.text}
            </Text>
        </View>
    )
}

return ( 
        <View style={styles.container}>
            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder=''
                    placeholderTextColor="#aaaaaa"
                    onChangeText={(text) => setEntityText(text)}
                    value={entityText}
                    underlineColorAndroid="transparent"
                    autoCapitalize="none"
                />
                <TouchableOpacity style={styles.button} onPress={onAddButtonPress}>
                    <Text style={styles.buttonText}>Send</Text>
                </TouchableOpacity>
            </View>
              { entities && (
                <View style={styles.listContainer}>
                    <FlatList //neeeded to render each element in the list. We probably could have used a for loop as well. 
                        data={entities}
                        renderItem={renderEntity}
                        keyExtractor={(item) => item.id}
                        removeClippedSubviews={true}
                    />
                </View>
            )}
        </View>
    )
}