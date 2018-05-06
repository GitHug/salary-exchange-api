const request = require('request-promise');
const cache = require('./cache');
const permCache = require('./permCache');
const logger = require('./utils/logger');

const options = {
  uri: 'http://localhost:49161/rates/historical',
  headers: {
    'User-Agent': 'Request-Promise',
  },
  json: true,
};

const key = 'rates';
const requestHistoricalExchangeRates = async () => {
  let rates = cache.get(key);
  if (rates) {
    logger.info('Historical rates cache hit!');
  } else {
    logger.info('No hit in cache');
    try {
      rates = await request(options);
      logger.info('Rates retrieved successfully');

      if (rates) {
        logger.info('Caching results');
        cache.set(key, rates);
        permCache.set(key, rates);
      } else {
        logger.info('No data retrieved from request. Check perm cache');

        // Check if any data in perm cache
        rates = permCache.get(key);
        if (rates) {
          logger.info('Perm cache has data.');
        }
      }
    } catch (e) {
      logger.warn('Failed to retrieve rates from request');
      logger.warn(e);
      logger.info('Check perm cache');
      rates = permCache.get(key);
      if (rates) {
        logger.info('Perm cache has data.');
      }
    }
  }

  if (rates) {
    logger.info('Historical rates retrieved successfully');
  } else {
    logger.warn('No historical rates retrieved...');
    throw new Error('No historical rates available at this time');
  }
  return rates;
};

module.exports = requestHistoricalExchangeRates;
