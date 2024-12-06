import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid'; 
import { createClient } from 'redis';


const publishclient = createClient();
publishclient.connect();

const subscribeclient = createClient();
subscribeclient.connect();

const wss = new WebSocketServer({ port: 8080 });

const subscriptions: { [key: string]: { ws: WebSocket; rooms: string[] } } = {};

 
wss.on('connection', function connection(Usersocket) {
  console.log('Running on port: 8080');
  const id = uuidv4();
  subscriptions[id] = { ws: Usersocket, rooms: [] }; 

  Usersocket.on('message', (data) => {
    try {
      const parsedMessage: ParsedMessage = JSON.parse(data as unknown as string);

      if (parsedMessage.type === "SUBSCRIBE" && parsedMessage.roomId) {
        subscriptions[id].rooms.push(parsedMessage.roomId);

        if(OneUserSubscribeTo(parsedMessage.roomId)){
          console.log("subscribing on pubsub on roomId: "+parsedMessage.roomId)
          subscribeclient.subscribe(parsedMessage.roomId,(message)=>{
            const parsedMessage = JSON.parse(message);

            Object.keys(subscriptions).forEach((userId) => { 
              const { ws, rooms } = subscriptions[userId];
              if (rooms.includes(parsedMessage.roomId)) {
                ws.send(parsedMessage.message);
              }
            });
          })
        }
      }

      if(parsedMessage.type === "UNSUBSCRIBE" && parsedMessage.roomId){

        
        subscriptions[id].rooms = subscriptions[id].rooms.filter(room=>room!==parsedMessage.roomId)

        if(LastUserInRoom(parsedMessage.roomId)){
          console.log("Unsubscribing on pubsub on roomId: "+parsedMessage.roomId)
          subscribeclient.unsubscribe(parsedMessage.roomId);
        }
      }

      if (parsedMessage.type === "SENDMESSAGE" && parsedMessage.message && parsedMessage.roomId) {
        const { message, roomId } = parsedMessage;

        publishclient.publish(roomId,JSON.stringify({
          type:"sendMessage",
          roomId:roomId,
          message
        }))
        
      }

      // Usersocket.send('The data is: ' + data);
    } catch (error) {
      console.error("Error parsing message:", error);
      Usersocket.send("Invalid message format");
    }
  });
  

  Usersocket.on('close', () => {
    delete subscriptions[id];
  });
});

 function OneUserSubscribeTo(roomId:string){ 

  let NumberofPeoples = 0

  Object.keys(subscriptions).forEach((userId)=>{
    if(subscriptions[userId].rooms.includes(roomId)){
      NumberofPeoples= NumberofPeoples+1;
    }
  })

  if(NumberofPeoples===1){
    return true
  }

  return false;
 }


 function LastUserInRoom(roomId:string){ 

  let NumberofPeoples = 0

  Object.keys(subscriptions).forEach((userId)=>{
    if(subscriptions[userId].rooms.includes(roomId)){
      NumberofPeoples= NumberofPeoples+1;
    }
  })

  if(NumberofPeoples===0){
    return true
  }

  return false;
 }

interface ParsedMessage {
  type: string;
  message?: string;
  roomId?: string;
}
