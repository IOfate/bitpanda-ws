# BitPanda WS

Node.js websocket client for BitPanda.
Websocket API documentation: https://developers.bitpanda.com/exchange/?shell#websocket-api-overview

## IOfate

This package is made by the IOfate company and is open source, feel free to use it, share it and contribute!

## Features

- [x] Price ticks
  - [x] Subscription
  - [x] Unsubscribe
- [x] Candlesticks
  - [x] Subscription
  - [x] Unsubscribe
- [x] Emit errors by sockets
- [x] Auto-reconnect

## Install

```
$ npm install @iofate/bitpanda-ws
```

## How to use it

```js
import { BitPandaWs } from '@iofate/bitpanda-ws';

const main = async () => {
  const client = new BitPandaWs();
  const symbol = 'BTC/EUR';
  const candleTimeFrame = '1m';

  await client.open();

  client.on(`ticker-${symbol}`, ticker => console.log(ticker));
  client.on(`candle-${symbol}-${candleTimeFrame}`, candle => console.log(candle));
  client.on('error-ticker', error => console.error(error));
  client.on('error-candle', error => console.error(error));

  client.subscribeTicker(symbol);
  client.subscribeCandles(symbol, candleTimeFrame);
};

main();
```

## API

This package export one class `BitPandaWs` which extend from [Emittery](https://www.npmjs.com/package/emittery), which allow us to dispatch and listen events.
More information about Emittery API here: https://github.com/sindresorhus/emittery#api


### bitPandaWs = new BitPandaWs()

Create a new instance of BitPandaWs.

### bitPandaWs.open()

Open BitPanda websockets. **Must be called before any subscription!**

Returns a promise.

```js
import { BitPandaWs } from '@iofate/bitpanda-ws';

const bitPandaWs = new BitPandaWs();

await bitPandaWs.open();
```

### bitPandaWs.isOpen()

To know if sockets are open or not.

Returns a boolean.

```js
import { BitPandaWs } from '@iofate/bitpanda-ws';

const bitPandaWs = new BitPandaWs();

if (!bitPandaWs.isOpen()) {
  await bitPandaWs.open();
}
```

### bitPandaWs.subscribeTicker(symbol)

Subscribe to the websocket ticker of the chosen symbol.
Once called you'll be able to listen to ticker events for this symbol.
**`open` method must be called before calling this one.**

```js
import { BitPandaWs } from '@iofate/bitpanda-ws';

const bitPandaWs = new BitPandaWs();

await bitPandaWs.open();
bitPandaWs.subscribeTicker('BTC/EUR');
bitPandaWs.on('ticker-BTC/EUR', ticker => console.log(ticker));
```

### bitPandaWs.unsubscribeTicker(symbol)

Unsubscribe from the ticker websocket of the associated symbol.
Once called no more events will be dispatched.

```js
import { BitPandaWs } from '@iofate/bitpanda-ws';

const bitPandaWs = new BitPandaWs();

await bitPandaWs.open();
bitPandaWs.subscribeTicker('BTC/EUR');
const stopListenFn = bitPandaWs.on('ticker-BTC/EUR', ticker => console.log(ticker));
bitPandaWs.unsubscribeTicker('BTC/EUR');
stopListenFn();
```

### bitPandaWs.subscribeCandles(symbol, timeFrame)

Subscribe to the websocket candle of the chosen symbol and time frame.
Once called you'll be able to listen to candle events for this symbol.
**`open` method must be called before calling this one.**

Valid time frame: `'1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'`

```js
import { BitPandaWs } from '@iofate/bitpanda-ws';

const bitPandaWs = new BitPandaWs();

await bitPandaWs.open();
bitPandaWs.subscribeCandles('BTC/EUR', '1d');
bitPandaWs.on('candle-BTC/EUR-1d', candle => console.log(candle));
```

### bitPandaWs.unsubscribeCandles(symbol, timeFrame)

Unsubscribe from the candle websocket of the associated symbol.
Once called no more events will be dispatched.

```js
import { BitPandaWs } from '@iofate/bitpanda-ws';

const bitPandaWs = new BitPandaWs();

await bitPandaWs.open();
bitPandaWs.subscribeCandles('BTC/EUR', '1d');
const stopListenFn = bitPandaWs.on('candle-BTC/EUR-1d', candle => console.log(candle));
bitPandaWs.unsubscribeCandles('BTC/EUR', '1d');
stopListenFn();
```
