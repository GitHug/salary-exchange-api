const { readFileSync } = require('fs');
const { makeExecutableSchema } = require('graphql-tools');
const { Query, fetchRates } = require('./db');

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
      fetchRates(new Query(period, currency, referenceCurrency, amount)),
  },
};

const schema = makeExecutableSchema({
  typeDefs: readFileSync('schema.graphql', 'utf8'),
  resolvers,
});

module.exports = schema;
