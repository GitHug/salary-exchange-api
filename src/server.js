const { readFileSync } = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');

const salad = {
  avocado: 1, mango: 1, tomato: 0.2, arugula: true, onion: true,
};
const burger = {
  buns: 2, shrimp: 1, egg: 1, lettuce: 2.5, mayo: true,
};
const salads = new Array(100).fill(salad);
const burgers = new Array(100).fill(burger);

const currency = { currencyCode: 'SEK', exchangeRate: 0.17 };
const currencies = new Array(100).fill(currency);

const get = (what, count) => what.splice(0, parseInt(count) || 1);

const schema = makeExecutableSchema({
  typeDefs: readFileSync('schema.graphql', 'utf8'),
  resolvers: {
    Query: {
      salads: (_, { count }) => get(salads, count),
      burgers: (_, { count }) => get(burgers, count),
      exchangeRates: (_, { currency }) => get(currency, currency),
    },
  },
});

const app = express();
app.get('/salads', ({ query: { count } }, res) => res.json(get(salads, count)));
app.get('/burgers', ({ query: { count } }, res) =>
  res.json(get(burgers, count)));
app.get('/exchangeRates', ({ query: { currency } }, res) =>
  res.json(get(currencies, currency)));
app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));


app.use('/test', (_, res) => {
  const Firestore = require('@google-cloud/firestore');

  const firestore = new Firestore({
    projectId: 'salary-exchange',
    keyFilename: './firestore_keyfile.json',
  });

  const document = firestore.doc('posts/intro-to-firestore');

  // Enter new data into the document.
  document.set({
    title: 'Welcome to Firestore',
    body: 'Hello derp',
  }).then(() => {
    // Document created successfully.
  });

  // Update an existing document.
  /* document.update({
    body: 'My first Firestore app',
  }).then(() => {
    console.log('cool');
  });

  // Read the document.
  document.get().then(doc => {
    console.log(doc);
  });

// Delete the document.
//document.delete().then(() => {
  // Document deleted successfully.
//}); */

  return res.json({ status: 'ok' });
});


app.listen(4000);

module.exports = app;
