const csvParser = require('./utils/csvParser');

class Query {
  constructor(period, currency, referenceCurrency, amount) {
    this.period = period;
    this.currency = currency;
    this.referenceCurrency = referenceCurrency;
    this.amount = amount;
  }
}

const findClosestDate = (date, exchangeRates) =>
  exchangeRates.find(rate => rate.Date <= date) || {};

const calculateRate = (currency, referenceCurrency) => {
  if (currency && referenceCurrency) {
    return referenceCurrency / currency;
  }
  return 0;
};

const getExchangeRate = (rate, query) => {
  let exchangeRate;
  const { currency, referenceCurrency } = query;
  if (currency === 'EUR') {
    exchangeRate = parseFloat(rate[referenceCurrency]);
  } else if (referenceCurrency === 'EUR') {
    exchangeRate = parseFloat(rate[currency]);
  } else {
    exchangeRate = calculateRate(rate[currency], rate[referenceCurrency]);
  }

  return exchangeRate;
};

const fetchRates = query => new Promise((resolve, reject) => {
  csvParser('./data/eurofxref-hist.csv')
    .then((exchangeRates) => {
      const closestDate = findClosestDate(query.period, exchangeRates).Date;

      resolve(exchangeRates
        .filter(rate => rate.Date >= (closestDate || query.period))
        .map((rate) => {
          const exchangeRate = getExchangeRate(rate, query);
          const { currency, referenceCurrency, amount } = query;
          const totalAmountExchangeRate = exchangeRate * amount;

          return {
            date: rate.Date,
            currency,
            referenceCurrency,
            exchangeRate,
            totalAmountExchangeRate: totalAmountExchangeRate || undefined,
            amount,
          };
        })
        .reverse());
    })
    .catch(err => reject(err));
});

const db = {
  fetchRates,
  Query,
};

module.exports = db;

