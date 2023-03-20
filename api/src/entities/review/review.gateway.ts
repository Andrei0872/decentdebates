import { IoAdapter } from '@nestjs/platform-socket.io';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SocketIOServer } from './review.model';
import { Socket } from 'socket.io';
import { ReviewService } from './review.service';

const PORT = 3002;

@WebSocketGateway(PORT, { namespace: 'comments', cors: { origin: 'http://localhost:3000', credentials: true }, cookie: true })
export class ReviewGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: SocketIOServer;

  constructor(private reviewService: ReviewService) { }

  afterInit(server: any) {
    console.log(`Websocket server up & running on port ${PORT}.`);
  }

  async handleConnection(socket: Socket, ...args: any[]) {
    try {
      await this.reviewService.checkUserExistsFromSocket(socket);
    } catch (err) {
      console.error(err.message);

      socket.emit('error', { reason: err.message });
      socket.disconnect(true);
    }
  }

  handleDisconnect(client: any) {
    console.log('disc');
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
