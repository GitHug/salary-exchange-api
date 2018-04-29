const chai = require('chai');
const fs = require('fs');
const path = require('path');
const chaiAsPromised = require('chai-as-promised');
const mock = require('mock-fs');
const { fetchBuyingPower } = require('../src/buyingPower');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('buyingPower', () => {
  beforeEach(() => {
    const mockData = fs.readFileSync(path.join(__dirname, '/test-exchangerates.csv'), 'utf8');

    mock({
      './data/eurofxref-hist.csv': mockData,
    });
  });

  it('should throw an error if both period and date is missing', () =>
    expect(fetchBuyingPower()).to.eventually.be.rejectedWith(Error));

  it('should always use period if available', () =>
    expect(fetchBuyingPower({ value: 'all' }, '2018-02-07', 'SEK', 'EUR')).to.eventually.deep.equal({
      currentExchangeRate: {
        amount: undefined,
        currency: 'SEK',
        date: '2018-02-09',
        exchangeRate: 9.9448,
        referenceCurrency: 'EUR',
        totalAmountExchangeRate: 9.9448,
      },
      difference: {
        currentBuyingPower: undefined,
        latestDate: '2018-02-09',
        originalBuyingPower: undefined,
        rate: '0.1165',
        ratePercentage: '1.19',
        sinceDate: '2018-01-02',
      },
      historicalExchangeRate: {
        amount: undefined,
        currency: 'SEK',
        date: '2018-01-02',
        exchangeRate: 9.8283,
        referenceCurrency: 'EUR',
        totalAmountExchangeRate: 9.8283,
      },
    }));

  it('should use the date if period is not available', () =>
    expect(fetchBuyingPower(undefined, '2018-02-07', 'SEK', 'EUR')).to.eventually.deep.equal({
      currentExchangeRate: {
        currency: 'SEK',
        date: '2018-02-09',
        exchangeRate: 9.9448,
        referenceCurrency: 'EUR',
      },
      difference: {
        currentBuyingPower: undefined,
        latestDate: '2018-02-09',
        originalBuyingPower: undefined,
        rate: '0.0863',
        ratePercentage: '0.88',
        sinceDate: '2018-02-07',
      },
      historicalExchangeRate: {
        currency: 'SEK',
        date: '2018-02-07',
        exchangeRate: 9.8585,
        referenceCurrency: 'EUR',
      },
    }));

  it('should use calculate buying power if an amount is given', () =>
    expect(fetchBuyingPower(undefined, '2018-02-07', 'SEK', 'EUR', 5000)).to.eventually.deep.equal({
      currentExchangeRate: {
        currency: 'SEK',
        date: '2018-02-09',
        exchangeRate: 9.9448,
        referenceCurrency: 'EUR',
      },
      difference: {
        currentBuyingPower: '49724.00',
        latestDate: '2018-02-09',
        originalBuyingPower: '49292.50',
        rate: '0.0863',
        ratePercentage: '0.88',
        sinceDate: '2018-02-07',
      },
      historicalExchangeRate: {
        currency: 'SEK',
        date: '2018-02-07',
        exchangeRate: 9.8585,
        referenceCurrency: 'EUR',
      },
    }));

  afterEach(mock.restore);
});
