import { BitPandaWs } from '../src/index';
import { Candle } from '../src/models/candle';
import { Ticker } from '../src/models/ticker';

const main = async () => {
  const client = new BitPandaWs();
  const symbol = 'BTC/EUR';
  const candleTimeFrame = '1m';

  await client.open();

  const emitter = client.subscribeTicker(symbol);
  client.subscribeCandles(symbol, candleTimeFrame);

  emitter.on(`ticker-${symbol}`, (ticker: Ticker) => console.log(ticker));
  emitter.on(`candle-${symbol}-${candleTimeFrame}`, (candle: Candle) => console.log(candle));

  setTimeout(() => {
    const symbol2 = 'ETH/EUR';

    client.subscribeTicker(symbol2);
    emitter.on(`ticker-${symbol2}`, (ticker: Ticker) => console.log(ticker));
  }, 3000);

  setInterval(() => {}, 1000);
};

main();
