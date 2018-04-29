const fs = require('fs');
const path = require('path');
const chai = require('chai');
const mock = require('mock-fs');
const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
const { fetchRates, fetchRateForDate } = require('../src/db');

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
    expect(fetchRates({ value: 1, unit: 'days' })).to.eventually.have.length(1));

  it('should return all records if the date is from way back', () =>
    expect(fetchRates({ value: 'all' })).to.eventually.have.length(29));

  it('should return records with the reference rates', () =>
    expect(fetchRates({ value: 1, unit: 'days' }, 'SEK', 'GBP', 1000)).to.eventually.deep.equal([{
      currency: 'SEK',
      date: '2018-02-09',
      exchangeRate: 0.08923256375191053,
      referenceCurrency: 'GBP',
      amount: 1000,
      totalAmountExchangeRate: 89.23256375191053,
    }]));

  it('should return records with the reference rates for Euro', () =>
    expect(fetchRates({ value: 1, unit: 'days' }, 'EUR', 'GBP', 1000)).to.eventually.deep.equal([{
      currency: 'EUR',
      date: '2018-02-09',
      exchangeRate: 0.8874,
      referenceCurrency: 'GBP',
      amount: 1000,
      totalAmountExchangeRate: 887.4,
    }]));

  it('should return the latest available records if no perioded provided', () =>
    expect(fetchRates(undefined, 'EUR', 'GBP', 1000)).to.eventually.deep.equal([{
      currency: 'EUR',
      date: '2018-02-09',
      exchangeRate: 0.8874,
      referenceCurrency: 'GBP',
      amount: 1000,
      totalAmountExchangeRate: 887.4,
    }]));

  it('should return the first available records if the period is before', async () => {
    const rates = await (fetchRates({ value: 30, unit: 'years' }, 'EUR', 'GBP', 1000));
    expect(rates[0]).to.deep.equal({
      amount: 1000,
      currency: 'EUR',
      date: '2018-01-02',
      exchangeRate: 0.88953,
      referenceCurrency: 'GBP',
      totalAmountExchangeRate: 889.5300000000001,
    });

    expect(rates[rates.length - 1]).to.deep.equal({
      amount: 1000,
      currency: 'EUR',
      date: '2018-02-09',
      exchangeRate: 0.8874,
      referenceCurrency: 'GBP',
      totalAmountExchangeRate: 887.4,
    });
  });

  describe('the chronological order', () => {
    let originalDateNow;
    const mockDateNow = () =>
      1518177600000; // 2018-02-09

    beforeEach(() => {
      originalDateNow = Date.now;
      Date.now = mockDateNow;
    });

    it('should return records in chronological order (later to most recent)', (done) => {
      fetchRates({ value: 2, unit: 'days' }, 'EUR', 'GBP', 1000)
        .then((rate) => {
          expect(rate).to.be.an('array').of.length(3);
          expect(rate[0].date).to.equal('2018-02-07');
          expect(rate[1].date).to.equal('2018-02-08');
          expect(rate[2].date).to.equal('2018-02-09');

          done();
        });
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });
  });


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

  describe('when calling fetchRateForDate method', () => {
    it('should return the rate for the given date', () =>
      expect(fetchRateForDate('2018-02-07', 'EUR', 'SEK')).to.eventually.deep.equal({
        date: '2018-02-07',
        currency: 'EUR',
        exchangeRate: 9.8585,
        referenceCurrency: 'SEK',
      }));

    it('should return the next closest earliest date if no exact date exists', () =>
      expect(fetchRateForDate('3000-02-07', 'USD', 'EUR')).to.eventually.deep.equal({
        date: '2018-02-09',
        currency: 'USD',
        exchangeRate: 1.2273,
        referenceCurrency: 'EUR',
      }));

    it('should throw an exception if the given date is before the earliest available date', () =>
      expect(fetchRateForDate('1970-02-07', 'USD', 'SEK')).to.eventually.be.rejectedWith(Error));

    describe('if no date is provided', () => {
      let clock;
      before(() => {
        clock = sinon.useFakeTimers(new Date('2018-02-08'));
      });

      it('should use today`s date', () => expect(fetchRateForDate(undefined, 'USD', 'SEK')).to.eventually.deep.equal({
        date: '2018-02-08',
        currency: 'USD',
        exchangeRate: 8.077701599738818,
        referenceCurrency: 'SEK',
      }));

      after(() => {
        clock.restore();
      });
    });
  });

  afterEach(mock.restore);
});
