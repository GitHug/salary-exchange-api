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

const calculateRate = (currencyFrom, currencyTo) => {
  if (currencyFrom && currencyTo) {
    return currencyTo / currencyFrom;
  }
  return 0;
};

const getExchangeRate = (rate, currencyFrom, currencyTo) => {
  let exchangeRate;
  if (currencyFrom === 'EUR') {
    exchangeRate = parseFloat(rate[currencyTo]);
  } else if (currencyTo === 'EUR') {
    exchangeRate = parseFloat(rate[currencyFrom]);
  } else {
    exchangeRate = calculateRate(rate[currencyFrom], rate[currencyTo]);
  }

  return exchangeRate;
};

const fetchRates = (period, currencyFrom, currencyTo, amount) =>
  new Promise((resolve, reject) => {
    csvParser('./data/eurofxref-hist.csv')
      .then((exchangeRates) => {
        const date = findDate(period, exchangeRates);
        const closestDate = findClosestDate(date, exchangeRates);

        resolve(exchangeRates
          .filter(rate => rate.Date >= closestDate)
          .map((rate) => {
            const exchangeRate = getExchangeRate(rate, currencyFrom, currencyTo);
            const totalAmountExchangeRate = exchangeRate * (amount || 1);

            return {
              date: rate.Date,
              currencyFrom,
              currencyTo,
              exchangeRate,
              totalAmountExchangeRate: totalAmountExchangeRate || undefined,
              amount,
            };
          })
          .reverse());
      })
      .catch(err => reject(err));
  });

const fetchRateForDate = async (date, currencyFrom, currencyTo) => {
  const dateRate = (date || moment(Date.now()).format('YYYY-MM-DD'));

  const exchangeRates = await csvParser('./data/eurofxref-hist.csv');

  const earliestAvailableDate = exchangeRates[exchangeRates.length - 1].Date;
  if (dateRate < earliestAvailableDate) {
    throw new Error(`Date ${date} is before the earliest available date ${earliestAvailableDate}`);
  }

  const rateForDate = exchangeRates.find(rate => rate.Date <= dateRate);
  const exchangeRate = getExchangeRate(rateForDate, currencyFrom, currencyTo);

  return {
    date: rateForDate.Date,
    currencyFrom,
    currencyTo,
    exchangeRate,
  };
};

const db = { fetchRates, fetchRateForDate };

module.exports = db;

