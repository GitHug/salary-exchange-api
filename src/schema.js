const { readFileSync } = require('fs');
const { makeExecutableSchema } = require('graphql-tools');
const { fetchRates } = require('./fetchHistoricalExchangeRates');
const { fetchBuyingPower } = require('./fetchBuyingPower');
const { fetchLatestExchangeRate } = require('./fetchLatestExchangeRate');

const Period = {
  ONE_MONTH: { value: 1, unit: 'month' },
  THREE_MONTHS: { value: 3, unit: 'months' },
  SIX_MONTHS: { value: 6, unit: 'months' },
  ONE_YEAR: { value: 1, unit: 'year' },
  THREE_YEARS: { value: 3, unit: 'years' },
  FIVE_YEARS: { value: 5, unit: 'years' },
  ALL: { value: 'all' },
};

const resolvers = {
  Period,
  Query: {
    exchangeRates: (_, {
      period, currencyFrom, currencyTo, amount,
    }) =>
      fetchRates(period, currencyFrom, currencyTo, amount),
    buyingPower: (_, {
      period, date, currencyFrom, currencyTo, amount,
    }) =>
      fetchBuyingPower(period, date, currencyFrom, currencyTo, amount),
    latestExchangeRate: (_, {
      currencyFrom, currencyTo,
    }) =>
      fetchLatestExchangeRate(currencyFrom, currencyTo),
  },
};

const schema = makeExecutableSchema({
  typeDefs: readFileSync('schema.graphql', 'utf8'),
  resolvers,
});

module.exports = { schema, Period };
