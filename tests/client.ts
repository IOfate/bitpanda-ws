import { BitPandaWs } from '../src/index';
import { Candle } from '../src/models/candle';
import { Ticker } from '../src/models/ticker';

const main = async () => {
  const client = new BitPandaWs();
  const symbol = 'BTC/EUR';
  const candleTimeFrame = '1m';

  await client.open();

  client.subscribeTicker(symbol);
  client.subscribeTicker('XRP/EUR');
  client.subscribeTicker('BEST/EUR');

  client.subscribeCandles(symbol, candleTimeFrame);

  client.on(`ticker-${symbol}`, (ticker: Ticker) => console.log(ticker));
  client.on('ticker-XRP/EUR', (ticker: Ticker) => console.log(ticker));
  client.on('ticker-BEST/EUR', (ticker: Ticker) => console.log(ticker));
  client.on(`candle-${symbol}-${candleTimeFrame}`, (candle: Candle) => console.log(candle));
  client.on('error-ticker', error => console.error(error));
  client.on('error-candle', error => console.error(error));

  setTimeout(() => {
    const symbol2 = 'ETH/EUR';

    client.subscribeTicker(symbol2);
    client.on(`ticker-${symbol2}`, (ticker: Ticker) => console.log(ticker));
  }, 3000);

  setInterval(() => {}, 1000);
};

main();
