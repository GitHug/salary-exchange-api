const { readFileSync } = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');

const { Query, fetchRates } = require('./db');

const resolvers = {
  Period: {
    ONE_MONTH: { value: 1, unit: 'months' },
    THREE_MONTHS: { value: 3, unit: 'months' },
    SIX_MONTHS: { value: 6, unit: 'months' },
    ONE_YEAR: { value: 1, unit: 'years' },
    THREE_YEARS: { value: 3, unit: 'years' },
    FIVE_YEARS: { value: 5, unit: 'years' },
    ALL: { value: 'all' },
  },
  Query: {
    exchangeRates: (_, {
      period, currency, referenceCurrency, amount,
    }) =>
      fetchRates(new Query(period, currency, referenceCurrency, amount)),
  },
};

const schema = makeExecutableSchema({
  typeDefs: readFileSync('schema.graphql', 'utf8'),
  resolvers,
});

const app = express();
app.get('/', (_, res) => res.redirect('/graphiql'));
app.get('/exchangeRates', ({
  query: {
    sinceDate, currency, referenceCurrency, amount,
  },
}, res) =>
  fetchRates(new Query(sinceDate, currency, referenceCurrency, amount))
    .then(data => res.json(data)));

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(4000);

module.exports = app;
