const NodeCache = require('node-cache');

let cache;

const hoursInSeconds = hours => hours && hours * 60 * 60;

const create = (ttl, checkPeriod) => {
  const ttlSeconds = hoursInSeconds(ttl);
  const checkPeriodSeconds = hoursInSeconds(checkPeriod);
  return new NodeCache({ stdTTL: ttlSeconds || 0, checkperiod: checkPeriodSeconds || 0 });
};

const init = (ttl, checkPeriod) => {
  cache = create(ttl, checkPeriod);
};

const set = (key, value, ch) => {
  const c = ch || cache;

  if (!c) {
    throw new Error('Cache not initialized. Call "cache.init(ttl, checkPeriod)"');
  }

  return c.set(key, value);
};

const get = (key, ch) => {
  const c = ch || cache;

  if (!c) {
    throw new Error('Cache not initialized. Call "cache.init(ttl, checkPeriod)"');
  }

  return c.get(key);
};

const reset = () => {
  cache = undefined;
};

module.exports = {
  create, init, set, get, reset,
};
