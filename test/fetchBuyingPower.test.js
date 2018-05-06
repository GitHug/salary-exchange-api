const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const nock = require('nock');
const { fetchBuyingPower } = require('../src/fetchBuyingPower');
const cache = require('../src/cache');
const permCache = require('../src/permCache');
const json = require('./rates.json');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('buyingPower', () => {
  let clock;

  beforeEach(() => {
    cache.init(1);
    permCache.init();

    clock = sinon.useFakeTimers(new Date('2018-05-04'));

    nock('http://localhost:49161')
      .get('/rates/historical')
      .reply(200, json);
  });

  it('should throw an error if both period and date is missing', () =>
    expect(fetchBuyingPower()).to.eventually.be.rejectedWith(Error));

  it('should always use period if available', () =>
    expect(fetchBuyingPower({ value: 'all' }, '2018-05-02', 'SEK', 'EUR')).to.eventually.deep.equal({
      currentExchangeRate: {
        amount: undefined,
        currencyFrom: 'SEK',
        date: '2018-05-04',
        exchangeRate: 10.5715,
        totalAmountExchangeRate: 10.5715,
        currencyTo: 'EUR',
      },
      difference: {
        currentBuyingPower: undefined,
        latestDate: '2018-05-04',
        originalBuyingPower: undefined,
        rate: '-0.0459',
        ratePercentage: '-0.43',
        sinceDate: '2018-05-02',
      },
      historicalExchangeRate: {
        amount: undefined,
        currencyFrom: 'SEK',
        "date": "2018-05-02",
        "exchangeRate": 10.6174,
        "totalAmountExchangeRate": 10.6174,
        currencyTo: 'EUR',
      },
    }));

  it('should use the date if period is not available', () =>
    expect(fetchBuyingPower(undefined, '2018-05-02', 'SEK', 'EUR')).to.eventually.deep.equal({
      currentExchangeRate: {
        currencyFrom: 'SEK',
        date: '2018-05-04',
        exchangeRate: 10.5715,
        currencyTo: 'EUR',
      },
      difference: {
        currentBuyingPower: undefined,
        latestDate: '2018-05-04',
        originalBuyingPower: undefined,
        rate: '-0.0459',
        ratePercentage: '-0.43',
        sinceDate: '2018-05-02',
      },
      historicalExchangeRate: {
        currencyFrom: 'SEK',
        date: '2018-05-02',
        exchangeRate: 10.6174,
        currencyTo: 'EUR',
      },
    }));

  it('should use calculate buying power if an amount is given', () =>
    expect(fetchBuyingPower(undefined, '2018-05-02', 'SEK', 'EUR', 5000)).to.eventually.deep.equal({
      currentExchangeRate: {
        currencyFrom: 'SEK',
        date: '2018-05-04',
        exchangeRate: 10.5715,
        currencyTo: 'EUR',
      },
      difference: {
        currentBuyingPower: '52857.50',
        latestDate: '2018-05-04',
        originalBuyingPower: '53087.00',
        rate: '-0.0459',
        ratePercentage: '-0.43',
        sinceDate: '2018-05-02',
      },
      historicalExchangeRate: {
        currencyFrom: 'SEK',
        date: '2018-05-02',
        exchangeRate: 10.6174,
        currencyTo: 'EUR',
      },
    }));

  afterEach(() => {
    cache.reset();
    permCache.reset();

    clock.restore();
  });
});
