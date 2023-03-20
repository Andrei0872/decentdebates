import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

const PORT = 3002;

@WebSocketGateway(PORT, { namespace: 'comments', cors: { origin: 'http://localhost:3000', credentials: true } })
export class ReviewGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  afterInit(server: any) {
    console.log(`Websocket server up & running on port ${PORT}.`);
  }

  handleConnection(client: any, ...args: any[]) {
    console.log('conn');
  }

  handleDisconnect(client: any) {
    console.log('disc');
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
