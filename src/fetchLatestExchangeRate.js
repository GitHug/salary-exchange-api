const rp = require('request-promise');
const moment = require('moment');
const logger = require('./utils/logger');

const options = {
  uri: 'https://openexchangerates.org/api/latest.json',
  qs: {
    app_id: process.env.OXR_APP_ID || logger.warn('Missing app id for OXR'),
  },
  headers: {
    'User-Agent': 'Request-Promise',
  },
  json: true,
};

const warnAndThrow = (currency) => {
  const errorString = `No such currency ${currency}`;
  logger.warn(errorString);
  throw new Error(errorString);
};

const validateCurrencyCodes = (currencyFrom, currencyTo, rates) => {
  if (!rates[currencyFrom]) {
    warnAndThrow(currencyFrom);
  }

  if (!rates[currencyTo]) {
    warnAndThrow(currencyTo);
  }
};

const calculateExchangeRate = (currencyFrom, currencyTo, base, rates) => {
  let exchangeRate;
  if (currencyFrom === base) {
    exchangeRate = rates[currencyTo];
  } else if (currencyTo === base) {
    exchangeRate = 1 / rates[currencyFrom];
  } else {
    const exchangeRateFrom = rates[currencyFrom];
    const exchangeRateTo = rates[currencyTo];

    exchangeRate = exchangeRateFrom && exchangeRateTo / exchangeRateFrom;
  }

  return exchangeRate;
};

const getTimeAndDate = (timestamp) => {
  const t = new Date();
  t.setSeconds(timestamp);
  const m = moment.unix(timestamp);

  const date = m.format('YYYY-MM-DD');
  const time = m.format('HH:MM:ss');
  const timezone = m.format('Z');

  return { date, time, timezone };
};

const processExchangeRate = (currencyFrom, currencyTo, { base, rates, timestamp }) => {
  validateCurrencyCodes(currencyFrom, currencyTo, rates);

  const exchangeRate = calculateExchangeRate(currencyFrom, currencyTo, base, rates);
  const timeAndDate = getTimeAndDate(timestamp);

  return {
    date: timeAndDate.date,
    time: timeAndDate.time,
    timezone: timeAndDate.timezone,
    exchangeRate,
    currencyFrom,
    currencyTo,
  };
};

const fetchLatestExchangeRate = async (currencyFrom, currencyTo) => {
  let data = {};
  try {
    logger.info('Fetching latest exchange rates...');
    data = await rp(options);
  } catch (e) {
    logger.warn(e);
    throw e;
  }
  return processExchangeRate(currencyFrom, currencyTo, data);
};

module.exports = { fetchLatestExchangeRate };
