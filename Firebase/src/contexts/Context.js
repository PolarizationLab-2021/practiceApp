import {createContext} from 'react';

export const AuthContext = createContext();
export const UserContext = createContext();
export const ChatContext = createContext({
    conversation: null,
    updateConversation: () => {},
}
);
