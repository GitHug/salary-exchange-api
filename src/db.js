const moment = require('moment');
const csvParser = require('./utils/csvParser');

const findDate = (period, exchangeRates) => {
  const date = Date.now();

  const { value, unit } = (period || { value: 0, unit: 'days' });
  if (value === 'all') {
    return exchangeRates[exchangeRates.length - 1].Date;
  }
  return moment(date).subtract(value, unit).format('YYYY-MM-DD');
};

const findClosestDate = (date, exchangeRates) =>
  (exchangeRates.find(rate => rate.Date <= date) || {}).Date || date;

const calculateRate = (currency, referenceCurrency) => {
  if (currency && referenceCurrency) {
    return referenceCurrency / currency;
  }
  return 0;
};

const getExchangeRate = (rate, currency, referenceCurrency) => {
  let exchangeRate;
  if (currency === 'EUR') {
    exchangeRate = parseFloat(rate[referenceCurrency]);
  } else if (referenceCurrency === 'EUR') {
    exchangeRate = parseFloat(rate[currency]);
  } else {
    exchangeRate = calculateRate(rate[currency], rate[referenceCurrency]);
  }

  return exchangeRate;
};

const fetchRates = (period, currency, referenceCurrency, amount) =>
  new Promise((resolve, reject) => {
    csvParser('./data/eurofxref-hist.csv')
      .then((exchangeRates) => {
        const date = findDate(period, exchangeRates);
        const closestDate = findClosestDate(date, exchangeRates);

        resolve(exchangeRates
          .filter(rate => rate.Date >= closestDate)
          .map((rate) => {
            const exchangeRate = getExchangeRate(rate, currency, referenceCurrency);
            const totalAmountExchangeRate = exchangeRate * (amount || 1);

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

const fetchRateForDate = async (date, currency, referenceCurrency) => {
  const dateRate = (date || moment(Date.now()).format('YYYY-MM-DD'));

  const exchangeRates = await csvParser('./data/eurofxref-hist.csv');

  const earliestAvailableDate = exchangeRates[exchangeRates.length - 1].Date;
  if (dateRate < earliestAvailableDate) {
    throw new Error(`Date ${date} is before the earliest available date ${earliestAvailableDate}`);
  }

  const rateForDate = exchangeRates.find(rate => rate.Date <= dateRate);
  const exchangeRate = getExchangeRate(rateForDate, currency, referenceCurrency);

  return {
    date: rateForDate.Date,
    currency,
    referenceCurrency,
    exchangeRate,
  };
};

const db = { fetchRates, fetchRateForDate };

module.exports = db;

