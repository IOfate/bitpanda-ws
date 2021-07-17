# BitPanda WS

Node.js websocket client for BitPanda.

Websocket API documentation: https://developers.bitpanda.com/exchange/?shell#websocket-api-overview

## Features

- [x] Price ticks
  - [x] Subscription
  - [x] Unsubscribe
- [x] Candlesticks
  - [x] Subscription
  - [x] Unsubscribe

## How to use it

```js
import { BitPandaWs } from 'bitpanda-ws';

const main = async () => {
  const client = new BitPandaWs();
  const symbol = 'BTC/EUR';
  const candleTimeFrame = '1m';

  await client.open();

  client.on(`ticker-${symbol}`, ticker => console.log(ticker));
  client.on(`candle-${symbol}-${candleTimeFrame}`, candle => console.log(candle));
  client.subscribeTicker(symbol);
  client.subscribeCandles(symbol, candleTimeFrame);
};

main();
```
