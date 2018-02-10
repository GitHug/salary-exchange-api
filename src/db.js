const csvParser = require('./utils/csvParser');

class Query {
  constructor(period, currency, referenceCurrency, salary) {
    this.period = period;
    this.currency = currency;
    this.referenceCurrency = referenceCurrency;
    this.salary = salary;
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
            salaryExchangeRate: query.salary &&
              calculateRate(rate[query.currency], rate[query.referenceCurrency], query.salary),
            salary: query.salary,
          }
        ))))
    .catch(err => reject(err));

  /* csvParser('./data/eurofxref-hist.csv')
    .then(exchangeRates =>
      resolve(exchangeRates
        .filter(rate => rate.Date >= query.period)
        .map(rate => (
          {
            date: rate.Date,
            currency: query.currency,
            referenceCurrency: query.referenceCurrency,
            exchangeRate: calculateRate(rate[query.currency], rate[query.referenceCurrency]),
            salaryExchangeRate:
              calculateRate(rate[query.currency], rate[query.referenceCurrency], query.salary),
          }
        ))))
    .catch(err => reject(err)); */
});

const db = {
  fetchRates,
  Query,
};

module.exports = db;

