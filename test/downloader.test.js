const rewire = require('rewire');
const mockfs = require('mock-fs');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');

const {
  downloader, __get__,
} = rewire('../src/utils/downloader');

chai.use(chaiAsPromised);
const { expect } = chai;

/* eslint-disable no-underscore-dangle */
describe('downloader', () => {
  beforeEach(() => {
    mockfs({
      data: {},
    });
  });

  it('should expose two methods', () => {
    expect(downloader.fetchHistoricalRates).to.be.instanceOf(Function);
  });

  it('should fetch the historical rates from the European Central Bank and return the path', () =>
    expect(downloader.fetchHistoricalRates()).to.eventually.equal('./data/eurofxref-hist.csv')).timeout(5000);

  describe('error handling', () => {
    it('should fail as expected when ECB site is down', () => {
      nock('https://www.ecb.europa.eu')
        .get('/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html')
        .reply(404);

      return expect(downloader.fetchHistoricalRates()).to.eventually.be.rejected;
    });

    it('should fail as expected when the url passed to download can not be resolved', () => {
      const download = __get__('download');
      nock('www.example.com')
        .get('/thefile.zip')
        .reply(404);

      return expect(download('www.example.com/thefile.zip')).to.eventually.be.rejected;
    });
  });

  afterEach(() => {
    mockfs.restore();
  });
});
