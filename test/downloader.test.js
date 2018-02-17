const rewire = require('rewire');
const mockfs = require('mock-fs');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');

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


  it('should expose two methods', () => {
    expect(downloader.fetchCurrentRates).to.be.instanceOf(Function);
    expect(downloader.fetchHistoricalRates).to.be.instanceOf(Function);
  });

  it('should fetch the current rates from the European Central Bank and return the path', () =>
    expect(downloader.fetchCurrentRates()).to.eventually.equal('./data/eurofxref.csv')).timeout(5000);

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

    describe('schedule', () => {
      it('should schedule a job to fetch historical rates at 16:00', () => {
        const clock = sinon.useFakeTimers(new Date('2018-02-15T15:59:59'));
        cli(['schedule']);
        expect(stub.callCount).to.equal(0);
        clock.tick(1000);
        expect(stub.callCount).to.equal(1);
        clock.restore();
      });

      it('should only fetch historical rates on weekdays', () => {
        const clock1 = sinon.useFakeTimers(new Date('2018-02-17T15:59:59'));
        cli(['schedule']);
        expect(stub.callCount).to.equal(0);
        clock1.tick(1000);
        expect(stub.callCount).to.equal(0);
        clock1.restore();

        const clock2 = sinon.useFakeTimers(new Date('2018-02-18T15:59:59'));
        clock2.tick(1000);
        expect(stub.callCount).to.equal(0);
        clock2.restore();
      });

      it('shoud fetch historical rates on all weekdays', () => {
        const clock1 = sinon.useFakeTimers(new Date('2018-02-12T15:59:59')); // Monday
        let sched = cli(['schedule']);
        expect(stub.callCount, 'Monday').to.equal(0);
        clock1.tick(1000);
        expect(stub.callCount).to.equal(1);
        sched.cancel();
        clock1.restore();

        const clock2 = sinon.useFakeTimers(new Date('2018-02-13T15:59:59')); // Tuesday
        sched = cli(['schedule']);
        clock2.tick(1000);
        expect(stub.callCount, 'Tuesday').to.equal(2);
        sched.cancel();
        clock2.restore();

        const clock3 = sinon.useFakeTimers(new Date('2018-02-14T15:59:59')); // Wednesday
        sched = cli(['schedule']);
        clock3.tick(1000);
        expect(stub.callCount, 'Wednesday').to.equal(3);
        sched.cancel();
        clock3.restore();

        const clock4 = sinon.useFakeTimers(new Date('2018-02-15T15:59:59')); // Thursday
        sched = cli(['schedule']);
        clock4.tick(1000);
        expect(stub.callCount, 'Thursday').to.equal(4);
        sched.cancel();
        clock4.restore();

        const clock5 = sinon.useFakeTimers(new Date('2018-02-16T15:59:59')); // Friday
        sched = cli(['schedule']);
        clock5.tick(1000);
        expect(stub.callCount, 'Friday').to.equal(5);
        sched.cancel();
        clock5.restore();
      });
    });

    it('should be possible to cancel a scheduled job', () => {
      const schedule = cli(['schedule']);
      const spy = sinon.spy(schedule, 'cancel');

      expect(spy.callCount).to.equal(0);
      cli(['stop-schedule']);
      expect(spy.callCount).to.equal(1);
    });

    it('should do nothing if an unknown argument is passed', () => {
      cli(['foobarbaz']);
      expect(stub.callCount).to.equal(0);
    });

    afterEach(() => {
      revert();
    });
  });

  afterEach(() => {
    mockfs.restore();
  });
});
