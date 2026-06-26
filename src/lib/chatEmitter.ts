import { EventEmitter } from 'events';

// Define a custom interface for the global object to hold our emitter
interface GlobalWithChatEmitter {
  chatEmitter: EventEmitter;
}

const globalForChat = global as unknown as GlobalWithChatEmitter;

export const chatEmitter = globalForChat.chatEmitter || new EventEmitter();

// Increased max listeners since each connected client might add a listener
chatEmitter.setMaxListeners(1000);

if (process.env.NODE_ENV !== 'production') {
  globalForChat.chatEmitter = chatEmitter;
}
