import Emittery from 'emittery';
import WebSocket from 'ws';

/** Root */
import { wsUrl } from '../const';

export abstract class SocketBase {
  protected readonly ws: WebSocket;
  protected readonly subscriptions: string[];
  protected isOpen: boolean;

  constructor(
    protected readonly emitter: Emittery,
    protected readonly channelName: string,
    protected readonly type: string,
  ) {
    this.ws = new WebSocket(wsUrl);
    this.subscriptions = [];
    this.isOpen = false;
  }

  open(): Promise<void> {
    if (this.isOpen) {
      return;
    }

    return new Promise(resolve => {
      this.ws.on('open', () => {
        this.isOpen = true;

        this.ws.on('message', (data: string) => {
          const received = JSON.parse(data);

          if (received.channel_name === this.channelName && received.type === this.type) {
            this.onMessage(received);
          }
        });

        resolve();
      });
    });
  }

  protected abstract onMessage(data: any): void;

  protected requireSocketToBeOpen() {
    if (!this.isOpen) {
      throw new Error('Please call open before subscribing');
    }
  }

  protected getSubscriptionType() {
    return this.subscriptions.length > 1
      ? 'UPDATE_SUBSCRIPTION'
      : 'SUBSCRIBE';
  }

  protected formatApiSymbol(symbol: string): string {
    return symbol.replace('/', '_').toUpperCase();
  }

  protected formatHumanSymbol(symbol: string): string {
    return symbol.replace('_', '/').toUpperCase();
  }
}
