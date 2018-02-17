const { readFileSync } = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');

const { Query, fetchRates } = require('./db');

const schema = makeExecutableSchema({
  typeDefs: readFileSync('schema.graphql', 'utf8'),
  resolvers: {
    Query: {
      exchangeRates: (_, {
        sinceDate, currency, referenceCurrency, amount,
      }) =>
        fetchRates(new Query(sinceDate, currency, referenceCurrency, amount)),
    },
  },
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
