import Emittery from 'emittery';
import WebSocket from 'ws';

/** Root */
import { wsUrl } from '../const';

export abstract class SocketBase {
  protected readonly errorType = 'ERROR';
  protected ws: WebSocket;
  protected subscriptions: string[];
  protected socketOpen: boolean;
  protected askingClose: boolean;

  constructor(
    protected readonly emitter: Emittery,
    protected readonly channelName: string,
    protected readonly type: string,
    protected readonly errorKey: string,
  ) {
    this.subscriptions = [];
    this.socketOpen = false;
    this.askingClose = false;
  }

  isOpen(): boolean {
    return this.socketOpen;
  }

  open(): Promise<void> {
    if (this.socketOpen) {
      return;
    }

    this.ws = new WebSocket(wsUrl);

    return new Promise((resolve) => {
      this.ws.on('open', () => {
        this.socketOpen = true;
        this.askingClose = false;

        if (this.subscriptions.length) {
          this.sendSubscription();
        }

        this.ws.on('message', (data: string) => {
          const received = JSON.parse(data);

          if (received.channel_name === this.channelName && received.type === this.type) {
            this.onMessage(received);
          }

          if (received.type === this.errorType) {
            this.emitter.emit(`error-${this.type}`, received);
          }
        });

        this.ws.on('close', () => {
          this.socketOpen = false;

          if (!this.askingClose) {
            this.open();
          }
        });

        resolve();
      });
    });
  }

  protected abstract onMessage(data: { [key: string]: any }): void;
  protected abstract sendSubscription(): void;

  protected sendUnsubscribe(): void {
    this.ws.send(
      JSON.stringify({
        type: this.getUnsubscribeType(),
        channels: [this.channelName],
      }),
    );
    this.askingClose = true;
    this.ws.close();
  }

  protected requireSocketToBeOpen(): void {
    if (!this.isOpen) {
      throw new Error('Please call open before subscribing');
    }
  }

  protected getSubscriptionType(): string {
    return this.subscriptions.length > 1 ? 'UPDATE_SUBSCRIPTION' : 'SUBSCRIBE';
  }

  protected getUnsubscribeType(): string {
    return 'UNSUBSCRIBE';
  }

  protected formatApiSymbol(symbol: string): string {
    return symbol.replace('/', '_').toUpperCase();
  }

  protected formatHumanSymbol(symbol: string): string {
    return symbol.replace('_', '/').toUpperCase();
  }
}
