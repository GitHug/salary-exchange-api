const rewire = require('rewire');
const mockfs = require('mock-fs');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const {
  downloader, cli, __set__, __get__,
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

  it('should fetch the current rates from the European Central Bank and return the path', () =>
    expect(downloader.fetchCurrentRates()).to.eventually.equal('./data/eurofxref.csv'));

  it('should fetch the historical rates from the European Central Bank and return the path', () =>
    expect(downloader.fetchHistoricalRates()).to.eventually.equal('./data/eurofxref-hist.csv'));

  describe('cli', () => {
    let stub;
    let revert;

    beforeEach(() => {
      stub = sinon.stub();
      revert = __set__('fetchECBRates', stub);
    });

    it('should fetch all rates', () => {
      cli(['all']);

      expect(stub.callCount).to.equal(2);
      expect(stub.getCall(0).args[0]).to.equal(__get__('fetchCurrentRatesHref'));
      expect(stub.getCall(1).args[0]).to.equal(__get__('fetchHistoricalRatesHref'));
    });

    it('should fetch daily rates', () => {
      cli(['daily']);
      expect(stub.callCount).to.equal(1);
      expect(stub.getCall(0).args[0]).to.equal(__get__('fetchCurrentRatesHref'));
    });

    it('should fetch historical rates', () => {
      cli(['historical']);
      expect(stub.callCount).to.equal(1);
      expect(stub.getCall(0).args[0]).to.equal(__get__('fetchHistoricalRatesHref'));
    });

    afterEach(() => {
      revert();
    });
  });

  afterEach(() => {
    mockfs.restore();
  });
});
