const { readFileSync } = require('fs');
const { makeExecutableSchema } = require('graphql-tools');
const { fetchRates } = require('./db');
const { fetchBuyingPower } = require('./buyingPower');

const resolvers = {
  Period: {
    ONE_MONTH: { value: 1, unit: 'month' },
    THREE_MONTHS: { value: 3, unit: 'months' },
    SIX_MONTHS: { value: 6, unit: 'months' },
    ONE_YEAR: { value: 1, unit: 'year' },
    THREE_YEARS: { value: 3, unit: 'years' },
    FIVE_YEARS: { value: 5, unit: 'years' },
    ALL: { value: 'all' },
  },
  Query: {
    exchangeRates: (_, {
      period, currency, referenceCurrency, amount,
    }) =>
      fetchRates(period, currency, referenceCurrency, amount),
    buyingPower: (_, {
      period, date, currency, referenceCurrency, amount,
    }) =>
      fetchBuyingPower(period, date, currency, referenceCurrency, amount),
  },
};

const schema = makeExecutableSchema({
  typeDefs: readFileSync('schema.graphql', 'utf8'),
  resolvers,
});

module.exports = schema;
