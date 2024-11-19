import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs

const wss = new WebSocketServer({ port: 8080 });

const subscriptions: { [key: string]: { ws: WebSocket; rooms: string[] } } = {};

setInterval(() => {
  console.log(subscriptions);
}, 5000);

wss.on('connection', function connection(Usersocket) {
  console.log('Running on port: 8080');
  const id = uuidv4();
  subscriptions[id] = { ws: Usersocket, rooms: [] };

  Usersocket.on('message', (data) => {
    try {
      const parsedMessage: ParsedMessage = JSON.parse(data as unknown as string);

      if (parsedMessage.type === "SUBSCRIBE" && parsedMessage.roomId) {
        subscriptions[id].rooms.push(parsedMessage.roomId);
      }

      if(parsedMessage.type === "UNSUBSCRIBE" && parsedMessage.roomId){
        subscriptions[id].rooms = subscriptions[id].rooms.filter(room=>room!==parsedMessage.roomId)
      }

      if (parsedMessage.type === "SENDMESSAGE" && parsedMessage.message && parsedMessage.roomId) {
        const { message, roomId } = parsedMessage;

        Object.keys(subscriptions).forEach((userId) => { 
          const { ws, rooms } = subscriptions[userId];
          if (rooms.includes(roomId)) {
            ws.send(message);
          }
        });
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

interface ParsedMessage {
  type: string;
  message?: string;
  roomId?: string;
}
