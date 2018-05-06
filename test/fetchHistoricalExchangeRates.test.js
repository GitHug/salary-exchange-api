const chai = require('chai');
const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
const { fetchRates, fetchRateForDate } = require('../src/fetchHistoricalExchangeRates');
const json = require('./rates.json');
const nock = require('nock');
const cache = require('../src/cache');
const permCache = require('../src/permCache');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('fetchHistoricalExchangeRates', () => {
  before(() => {
    nock('http://localhost:49161')
      .get('/rates/historical')
      .reply(200, json);

    cache.init(1);
    permCache.init();
  });

  it('should return one record if the latest available data', () =>
    expect(fetchRates({ value: 1, unit: 'days' })).to.eventually.have.length(1));

  it('should return all records if the date is from way back', () =>
    expect(fetchRates({ value: 'all' })).to.eventually.have.length(3));

  it('should return records with the reference rates', () =>
    expect(fetchRates({ value: 1, unit: 'days' }, 'SEK', 'GBP', 1000)).to.eventually.deep.equal([{
      currencyFrom: 'SEK',
      date: '2018-05-04',
      exchangeRate: 0.08346497658799602,
      totalAmountExchangeRate: 83.46497658799602,
      currencyTo: 'GBP',
      amount: 1000,
    }]));

  it('should return records with the reference rates for Euro', () =>
    expect(fetchRates({ value: 1, unit: 'days' }, 'EUR', 'GBP', 1000)).to.eventually.deep.equal([{
      currencyFrom: 'EUR',
      date: '2018-05-04',
      exchangeRate: 0.88235,
      totalAmountExchangeRate: 882.35,
      currencyTo: 'GBP',
      amount: 1000,
    }]));

  it('should return the latest available records if no perioded provided', () =>
    expect(fetchRates(undefined, 'EUR', 'GBP', 1000)).to.eventually.deep.equal([{
      currencyFrom: 'EUR',
      date: '2018-05-04',
      exchangeRate: 0.88235,
      totalAmountExchangeRate: 882.35,
      currencyTo: 'GBP',
      amount: 1000,
    }]));

  it('should return the first available record if the period is before', async () => {
    const rates = await (fetchRates({ value: 30, unit: 'years' }, 'EUR', 'GBP', 1000));
    expect(rates[0]).to.deep.equal({
      amount: 1000,
      currencyFrom: 'EUR',
      date: '2018-05-02',
      exchangeRate: 0.8804,
      totalAmountExchangeRate: 880.4,
      currencyTo: 'GBP',
    });

    expect(rates[rates.length - 1]).to.deep.equal({
      amount: 1000,
      currencyFrom: 'EUR',
      date: '2018-05-04',
      exchangeRate: 0.88235,
      totalAmountExchangeRate: 882.35,
      currencyTo: 'GBP',
    });
  });

  describe('the chronological order', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers(new Date('2018-05-04'));
    });

    it('should return records in chronological order (later to most recent)', async () => {
      const rates = await fetchRates({ value: 2, unit: 'days' }, 'EUR', 'GBP', 1000);
      expect(rates).to.be.an('array').of.length(3);
      expect(rates[0].date).to.equal('2018-05-02');
      expect(rates[1].date).to.equal('2018-05-03');
      expect(rates[2].date).to.equal('2018-05-04');
    });

    afterEach(() => {
      clock.restore();
    });
  });

  describe('when calling fetchRateForDate method', () => {
    it('should return the rate for the given date', () =>
      expect(fetchRateForDate('2018-05-02', 'EUR', 'SEK')).to.eventually.deep.equal({
        date: '2018-05-02',
        exchangeRate: 10.6174,
        currencyFrom: 'EUR',
        currencyTo: 'SEK',
      }));

    it('should return the next closest latest date if no exact date exists', () =>
      expect(fetchRateForDate('3000-02-07', 'USD', 'EUR')).to.eventually.deep.equal({
        date: '2018-05-04',
        exchangeRate: 1.1969,
        currencyFrom: 'USD',
        currencyTo: 'EUR',
      }));

    it('should throw an exception if the given date is before the earliest available date', () =>
      expect(fetchRateForDate('1970-02-07', 'USD', 'SEK')).to.eventually.be.rejectedWith(Error));

    describe('if no date is provided', () => {
      let clock;
      before(() => {
        clock = sinon.useFakeTimers(new Date('2018-05-02'));
      });

      it('should use today`s date', () =>
        expect(fetchRateForDate(undefined, 'USD', 'SEK')).to.eventually.deep.equal({
          date: '2018-05-02',
          exchangeRate: 8.842675106188056,
          currencyFrom: 'USD',
          currencyTo: 'SEK',
        }));

      after(() => {
        clock.restore();
        cache.reset();
        permCache.reset();
      });
    });
  });
});
