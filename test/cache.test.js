const { expect } = require('chai');
const sinon = require('sinon');
const cache = require('../src/cache');

describe('cache', () => {
  beforeEach(cache.reset);

  describe('when not initialized', () => {
    it('should throw an error if not initialized when getting', () => {
      try {
        cache.get('key');
      } catch (e) {
        return expect(e.message).to.be.equal('Cache not initialized. Call "cache.init(ttl, checkPeriod)"');
      }
      return expect(true).to.be.equal(false, 'An error should have been thrown');
    });

    it('should throw an error if not initialized when setting', () => {
      try {
        cache.set('key', 'value');
      } catch (e) {
        return expect(e.message).to.be.equal('Cache not initialized. Call "cache.init(ttl, checkPeriod)"');
      }
      return expect(true).to.be.equal(false, 'An error should have been thrown');
    });
  });

  describe('when initialized', () => {
    beforeEach(() => {
      cache.init(10, 10);
    });

    it('should be able to set a value', () => {
      expect(cache.set('key', 'value')).to.be.equal(true);
    });

    it('should be able to get a value', () => {
      cache.set('key', 'value');
      expect(cache.get('key')).to.be.equal('value');
    });

    describe('the cache should expire', () => {
      const hoursAsMs = hours => hours * 60 * 60 * 1000;

      let clock;
      beforeEach(() => {
        clock = sinon.useFakeTimers();
      });

      it('should expire after 10 hours', () => {
        cache.set('key', 'value');
        clock.tick(hoursAsMs(9.9));
        expect(cache.get('key')).to.be.equal('value');
        clock.tick(hoursAsMs(0.2));
        return expect(cache.get('key')).to.be.undefined;
      });

      afterEach(() => {
        clock.restore();
      });
    });

    afterEach(() => {
      cache.reset();
    });
  });
});
