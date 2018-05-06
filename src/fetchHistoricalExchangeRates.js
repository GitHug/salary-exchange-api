const moment = require('moment');
const requestHistoricalExchangeRates = require('./requestHistoricalExchangeRates');

const findDate = (period, exchangeRates) => {
  const date = Date.now();

  const { value, unit } = (period || { value: 0, unit: 'days' });
  if (value === 'all') {
    return exchangeRates[0].Date;
  }
  return moment(date).subtract(value, unit).format('YYYY-MM-DD');
};

const findClosestDate = (date, exchangeRates) =>
  (exchangeRates.find(rate => rate.Date >= date) || {}).Date ||
  exchangeRates[exchangeRates.length - 1].Date;

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

const fetchRates = async (period, currencyFrom, currencyTo, amount) => {
  const exchangeRates = await requestHistoricalExchangeRates();
  const date = findDate(period, exchangeRates);
  const closestDate = findClosestDate(date, exchangeRates);
  const selectedExchangeRates = exchangeRates
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
    });

  return selectedExchangeRates;
};

const fetchRateForDate = async (date, currencyFrom, currencyTo) => {
  const dateRate = (date || moment(Date.now()).format('YYYY-MM-DD'));

  const exchangeRates = await requestHistoricalExchangeRates();

  const earliestAvailableDate = exchangeRates[0].Date;
  if (dateRate < earliestAvailableDate) {
    throw new Error(`Date ${date || dateRate} is before the earliest available date ${earliestAvailableDate}`);
  }

  const rateForDate = exchangeRates.find(rate => rate.Date >= dateRate) ||
    exchangeRates[exchangeRates.length - 1];

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

