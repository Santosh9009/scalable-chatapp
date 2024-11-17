import ws, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({port:8080})

wss.on('connection',function connection(ws){
  console.log('running on port :'+ 8080)

  ws.on('message',(data)=>{
    ws.send('The data is : '+data)
  })
})