import Emittery from 'emittery';

/** Models */
import { Candle } from '../models/candle';
import { RawCandle } from '../models/raw-candle';

/** Root */
import { SocketBase } from './socket-base';

export class SocketCandle extends SocketBase {
  private readonly candleTimes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];
  private readonly mapUnits = { m: 'MINUTES', h: 'HOURS', d: 'DAYS', w: 'WEEKS', M: 'MONTHS' };

  constructor(emitter: Emittery) {
    super(emitter, 'CANDLESTICKS', 'CANDLESTICK');
  }

  subscribe(symbol: string, timeFrame: string) {
    this.requireSocketToBeOpen();

    if (!this.candleTimes.includes(timeFrame)) {
      throw new Error(`Not a valid time frame allowed: ${this.candleTimes.join(', ')}`);
    }

    const formatSymbol = symbol.replace('/', '_').toUpperCase();
    const subscription = `${formatSymbol}-${timeFrame}`;
    const isInSubscriptions = this.subscriptions.some((candleSub: string) => candleSub === subscription);

    if (isInSubscriptions) {
      return;
    }

    this.subscriptions.push(subscription);
    this.sendSubscription();
  }

  unsubscribe(symbol: string, timeFrame: string) {
    this.requireSocketToBeOpen();

    const formatSymbol = symbol.replace('/', '_').toUpperCase();
    const subscription = `${formatSymbol}-${timeFrame}`;
    const isInSubscriptions = this.subscriptions.some((candleSub: string) => candleSub === subscription);

    if (!isInSubscriptions) {
      return;
    }

    this.subscriptions = this.subscriptions.filter((fSub: string) => fSub !== subscription);

    if (this.subscriptions.length) {
      this.sendSubscription();
    } else {
      this.sendUnsubscribe();
    }
  }

  protected onMessage(data: RawCandle) {
    const candle = this.format(data);
    const timeUnit = Object.keys(this.mapUnits)
      .find((timeShortcut: string) => this.mapUnits[timeShortcut] === candle.info.granularity.unit);
    const timeFrame = `${candle.info.granularity.period}${timeUnit}`;

    this.emitter.emit(`candle-${candle.symbol}-${timeFrame}`, candle);
  }

  protected sendSubscription() {
    this.ws.send(JSON.stringify({
      type: this.getSubscriptionType(),
      channels: [this.getCandlesticksChannel()],
    }));
  }

  private format(rawCandle: RawCandle): Candle {
    return {
      info: rawCandle,
      symbol: rawCandle.instrument_code.replace('_', '/'),
      close: Number(rawCandle.close),
      high: Number(rawCandle.high),
      low: Number(rawCandle.low),
      open: Number(rawCandle.open),
      volume: Number(rawCandle.volume),
    };
  }

  private getCandlesticksChannel() {
    if (!this.subscriptions.length) {
      return {};
    }

    return {
      name: 'CANDLESTICKS',
      properties: this.subscriptions.map((subscription: string) => {
        const [symbol, timeFrame] = subscription.split('-');
        const unit = timeFrame.charAt(timeFrame.length - 1);

        return {
          instrument_code: symbol,
          time_granularity: {
            unit: this.mapUnits[unit],
            period: Number(timeFrame.split(unit).shift()),
          },
        };
      }),
    };
  }
}
