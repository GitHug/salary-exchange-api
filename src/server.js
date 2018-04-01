const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const cors = require('cors');
const scheduler = require('./utils/scheduler.js');
const { Query, fetchRates } = require('./db');
const schema = require('./schema');

// Schedule a job to download ECB data
scheduler.scheduleJob();

const app = express();
// Add headers
app.use(cors({ origin: '*' }));

app.get('/', (_, res) => res.json(200));
app.get('/ping', (_, res) => res.status(200).json('I\'m alive!'));
app.get('/exchangeRates', ({
  query: {
    period, currency, referenceCurrency, amount,
  },
}, res) =>
  fetchRates(new Query(period, currency, referenceCurrency, amount))
    .then(data => res.json(data)));

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(4000);

module.exports = app;
