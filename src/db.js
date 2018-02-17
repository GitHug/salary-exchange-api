const csvParser = require('./utils/csvParser');

class Query {
  constructor(period, currency, referenceCurrency, amount) {
    this.period = period;
    this.currency = currency;
    this.referenceCurrency = referenceCurrency;
    this.amount = amount;
  }
}

const calculateRate = (currency, referenceCurrency, totalAmount) =>
  currency && referenceCurrency &&
  (totalAmount || 1) * (referenceCurrency / currency);

const fetchRates = query => new Promise((resolve, reject) => {
  csvParser('./data/eurofxref-hist.csv')
    .then(exchangeRates =>
      resolve(exchangeRates
        .filter(rate => rate.Date >= query.period)
        .map(rate => (
          {
            date: rate.Date,
            currency: query.currency,
            referenceCurrency: query.referenceCurrency,
            exchangeRate: calculateRate(rate[query.currency], rate[query.referenceCurrency]),
            totalAmountExchangeRate: query.amount &&
              calculateRate(rate[query.currency], rate[query.referenceCurrency], query.amount),
            amount: query.amount,
          }
        ))))
    .catch(err => reject(err));
});

const db = {
  fetchRates,
  Query,
};

module.exports = db;

