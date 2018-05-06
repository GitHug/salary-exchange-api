const cache = require('./cache');

let permCache;

const init = () => {
  permCache = cache.create();
};

const set = (key, value) => cache.set(key, value, permCache);

const get = key => cache.get(key, permCache);

const reset = () => {
  permCache = undefined;
};

module.exports = {
  init, set, get, reset,
};
