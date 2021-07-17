import Emittery from 'emittery';

/** Sockets */
import { SocketCandle } from './sockets/socket-candle';
import { SocketTicker } from './sockets/socket-ticker';

export class BitPandaWs extends Emittery {
  private readonly socketTicker: SocketTicker;
  private readonly socketCandle: SocketCandle;

  constructor() {
    super();
    this.socketTicker = new SocketTicker(this);
    this.socketCandle = new SocketCandle(this);
  }

  async open(): Promise<void> {
    await Promise.all([
      this.socketTicker.open(),
      this.socketCandle.open(),
    ]);
  }

  subscribeTicker(symbol: string): void {
    this.socketTicker.subscribe(symbol);
  }

  subscribeCandles(symbol: string, timeFrame: string): void {
    this.socketCandle.subscribe(symbol, timeFrame);
  }
}
