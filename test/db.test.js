const fs = require('fs');
const path = require('path');
const chai = require('chai');
const mock = require('mock-fs');
const chaiAsPromised = require('chai-as-promised');
const { Query, fetchRates } = require('../src/db');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('db', () => {
  beforeEach(() => {
    const mockData = fs.readFileSync(path.join(__dirname, '/test-exchangerates.csv'), 'utf8');

    mock({
      './data/eurofxref-hist.csv': mockData,
    });
  });

  it('should return one record if the latest available data', () =>
    expect(fetchRates(new Query('2018-02-09'))).to.eventually.have.length(1));

  it('should return all records if the date is from way back', () =>
    expect(fetchRates(new Query('1970-01-01'))).to.eventually.have.length(29));

  it('should return records with the reference rates', () =>
    expect(fetchRates(new Query('2018-02-09', 'SEK', 'GBP', 1000))).to.eventually.deep.equal([{
      currency: 'SEK',
      date: '2018-02-09',
      exchangeRate: 0.08923256375191053,
      referenceCurrency: 'GBP',
      amount: 1000,
      totalAmountExchangeRate: 89.23256375191053,
    }]));

  it('should return records with the reference rates for Euro', () =>
    expect(fetchRates(new Query('2018-02-09', 'EUR', 'GBP', 1000))).to.eventually.deep.equal([{
      currency: 'EUR',
      date: '2018-02-09',
      exchangeRate: 0.8874,
      referenceCurrency: 'GBP',
      amount: 1000,
      totalAmountExchangeRate: 887.4,
    }]));

  describe('when file is missing', () => {
    beforeEach(() => {
      mock({
        './data/': {},
      });
    });
    it('should be rejected', () =>
      expect(fetchRates()).to.eventually.be.rejected);
  });

  describe('when file is unable to be parsed', () => {
    beforeEach(() => {
      mock({
        './data/eurofxref-hist.csv': 'abc\n1,2',
      });
    });
    it('should be rejected', () =>
      expect(fetchRates()).to.eventually.be.rejected);
  });

  afterEach(mock.restore);
});
