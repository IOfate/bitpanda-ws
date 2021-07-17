import Emittery from 'emittery';
import WebSocket from 'ws';
import { Candle } from './models/candle';
import { RawCandle } from './models/raw-candle';

/** Models */
import { RawTicker } from './models/raw-ticker';
import { Ticker } from './models/ticker';

export class BitPandaWs extends Emittery {
  private readonly baseUrl = 'wss://streams.exchange.bitpanda.com';
  private readonly tickerChannelName = 'PRICE_TICKS';
  private readonly tickerType = 'PRICE_TICK';
  private readonly candleChannelName = 'CANDLESTICKS';
  private readonly candleType = 'CANDLESTICK';
  private readonly candleTimes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];
  private readonly mapUnits = { m: 'MINUTES', h: 'HOURS', d: 'DAYS', w: 'WEEKS', M: 'MONTHS' };
  private readonly tickerSubscriptions: string[];
  private readonly candleSubscriptions: string[];
  private readonly wsTicker: WebSocket;
  private readonly wsCandle: WebSocket;
  private isOpenTicker = false;
  private isOpenCandle = false;

  constructor() {
    super();
    this.tickerSubscriptions = [];
    this.candleSubscriptions = [];
    this.wsTicker = new WebSocket(this.baseUrl);
    this.wsCandle = new WebSocket(this.baseUrl);
  }

  async open(): Promise<void> {
    await Promise.all([
      this.openWsTicker(),
      this.openWsCandle(),
    ]);
  }

  subscribeTicker(symbol: string): void {
    if (!this.isOpenTicker) {
      throw new Error('Please call open before subscribing');
    }

    const formatSymbol = symbol.replace('/', '_').toUpperCase();
    const isInSubscriptions = this.tickerSubscriptions.some((marketSymbol: string) => marketSymbol === formatSymbol);

    if (isInSubscriptions) {
      return;
    }

    this.tickerSubscriptions.push(formatSymbol);
    this.wsTicker.send(JSON.stringify({
      type: this.tickerSubscriptions.length > 1 ? 'UPDATE_SUBSCRIPTION' : 'SUBSCRIBE',
      channels: [{
        name: 'PRICE_TICKS',
        instrument_codes: this.tickerSubscriptions,
      }],
    }));
  }

  subscribeCandles(symbol: string, timeFrame: string): Emittery {
    if (!this.isOpenCandle) {
      throw new Error('Please call open before subscribing');
    }

    if (!this.candleTimes.includes(timeFrame)) {
      throw new Error(`Not a valid time frame allowed: ${this.candleTimes.join(', ')}`);
    }

    const formatSymbol = symbol.replace('/', '_').toUpperCase();
    const subscription = `${formatSymbol}-${timeFrame}`;

    const isInSubscriptions = this.candleSubscriptions.some((candleSub: string) => candleSub === subscription);

    if (isInSubscriptions) {
      return;
    }

    this.candleSubscriptions.push(subscription);
    this.wsCandle.send(JSON.stringify({
      type: this.candleSubscriptions.length > 1 ? 'UPDATE_SUBSCRIPTION' : 'SUBSCRIBE',
      channels: [this.getCandlesticksChannel()],
    }));
  }

  private openWsTicker(): Promise<void> {
    if (this.isOpenTicker) {
      return;
    }

    return new Promise(resolve => {
      this.wsTicker.on('open', () => {
        this.isOpenTicker = true;

        this.wsTicker.on('message', (data: string) => {
          const received = JSON.parse(data);

          if (received.channel_name === this.tickerChannelName && received.type === this.tickerType) {
            const ticker = this.formatRawTicker(received);

            this.emit(`ticker-${ticker.symbol}`, ticker);
          }
        });

        resolve();
      });
    });
  }

  private openWsCandle(): Promise<void> {
    if (this.isOpenCandle) {
      return;
    }

    return new Promise(resolve => {
      this.wsCandle.on('open', () => {
        this.isOpenCandle = true;
        this.wsCandle.on('message', (data: string) => {
          const received = JSON.parse(data);

          if (received.channel_name === this.candleChannelName && received.type === this.candleType) {
            const candle = this.formatRawCandle(received);
            const timeUnit = Object.keys(this.mapUnits)
              .find((timeShortcut: string) => this.mapUnits[timeShortcut] === candle.info.granularity.unit);
            const timeFrame = `${candle.info.granularity.period}${timeUnit}`;

            this.emit(`candle-${candle.symbol}-${timeFrame}`, candle);
          }
        });
        resolve();
      });
    });
  }

  private getCandlesticksChannel() {
    if (!this.candleSubscriptions.length) {
      return {};
    }

    return {
      name: 'CANDLESTICKS',
      properties: this.candleSubscriptions.map((subscription: string) => {
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

  private formatRawTicker(rawTicker: RawTicker): Ticker {
    return {
      symbol: rawTicker.instrument_code.replace('_', '/'),
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

  private formatRawCandle(rawCandle: RawCandle): Candle {
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
}
