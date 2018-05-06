require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const cors = require('cors');
const { fetchRates } = require('./fetchHistoricalExchangeRates');
const { fetchBuyingPower } = require('./fetchBuyingPower');
const { fetchLatestExchangeRate } = require('./fetchLatestExchangeRate');
const { schema, Period } = require('./schema');

// Initialize caches
const ttl = 12;
const checkPeriod = 13;
require('./cache').init(ttl, checkPeriod);
require('./permCache').init();

const app = express();
// Add headers
app.use(cors({ origin: '*' }));

app.get('/', (_, res) => res.json(200));
app.get('/ping', (_, res) => res.status(200).json('I\'m alive!'));
app.get('/exchangeRates', ({
  query: {
    period, currencyFrom, currencyTo, amount,
  },
}, res) =>
  fetchRates(Period[period], currencyFrom, currencyTo, amount)
    .then(data => res.json(data)));

app.get('/buyingPower', ({
  query: {
    period, date, currencyFrom, currencyTo, amount,
  },
}, res) =>
  fetchBuyingPower(period, date, currencyFrom, currencyTo, amount)
    .then(data => res.json(data)));

app.get('/latestExchangeRate', ({
  query: {
    currencyFrom, currencyTo,
  },
}, res) =>
  fetchLatestExchangeRate(currencyFrom, currencyTo)
    .then(data => res.json(data)));

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(4000);

module.exports = app;
