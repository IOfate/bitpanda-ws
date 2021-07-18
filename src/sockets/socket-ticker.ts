import Emittery from 'emittery';

/** Models */
import { RawTicker } from '../models/raw-ticker';
import { Ticker } from '../models/ticker';

/** Root */
import { SocketBase } from './socket-base';

export class SocketTicker extends SocketBase {
  constructor(emitter: Emittery) {
    super(emitter, 'PRICE_TICKS', 'PRICE_TICK', 'ticker');
  }

  subscribe(symbol: string): void {
    this.requireSocketToBeOpen();

    const formatSymbol = this.formatApiSymbol(symbol);
    const isInSubscriptions = this.subscriptions.some(
      (marketSymbol: string) => marketSymbol === formatSymbol,
    );

    if (isInSubscriptions) {
      return;
    }

    this.subscriptions.push(formatSymbol);
    this.sendSubscription();
  }

  unsubscribe(symbol: string): void {
    this.requireSocketToBeOpen();

    const formatSymbol = this.formatApiSymbol(symbol);
    const isInSubscriptions = this.subscriptions.some(
      (marketSymbol: string) => marketSymbol === formatSymbol,
    );

    if (!isInSubscriptions) {
      return;
    }

    this.subscriptions = this.subscriptions.filter((fSymbol: string) => fSymbol !== symbol);

    if (this.subscriptions.length) {
      this.sendSubscription();
    } else {
      this.sendUnsubscribe();
    }
  }

  protected onMessage(data: RawTicker): void {
    const ticker = this.format(data);

    this.emitter.emit(`ticker-${ticker.symbol}`, ticker);
  }

  protected sendSubscription(): void {
    this.ws.send(
      JSON.stringify({
        type: this.getSubscriptionType(),
        channels: [
          {
            name: 'PRICE_TICKS',
            instrument_codes: this.subscriptions,
          },
        ],
      }),
    );
  }

  private format(rawTicker: RawTicker): Ticker {
    return {
      symbol: this.formatHumanSymbol(rawTicker.instrument_code),
      info: rawTicker,
      timestamp: Date.now(),
      datetime: rawTicker.time,
      high: Number(rawTicker.best_ask),
      low: Number(rawTicker.best_bid),
      ask: Number(rawTicker.best_ask),
      bid: Number(rawTicker.best_bid),
      last: Number(rawTicker.price),
      close: Number(rawTicker.price),
      volume: Number(rawTicker.volume),
    };
  }
}
