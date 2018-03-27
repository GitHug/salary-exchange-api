const sinon = require('sinon');
const rewire = require('rewire');
const moment = require('moment-timezone');
const { expect } = require('chai');

const {
  scheduleJob, __set__,
} = rewire('../src/utils/scheduler');

describe('scheduler', () => {
  describe('scheduling', () => {
    let stub;
    let revert;

    beforeEach(() => {
      stub = sinon.stub();
      revert = __set__('downloader', {
        fetchHistoricalRates: stub,
      });
    });

    it('should schedule a job to fetch historical rates at 16:00 (GMT+1)', () => {
      const clock = sinon.useFakeTimers(new Date(moment.tz('2018-02-15 15:59:59', 'Europe/Luxembourg')));
      scheduleJob();
      expect(stub.callCount).to.equal(0);
      clock.tick(1000);
      expect(stub.callCount).to.equal(1);
      clock.restore();
    });

    it('should fetch historical rates on all weekdays only at 16:00', () => {
      const clock = sinon.useFakeTimers(new Date(moment.tz('2018-02-12 15:59:59', 'Europe/Luxembourg')));
      scheduleJob();
      expect(stub.callCount, 'No scheduled jobs should have been executed').to.equal(0);
      clock.tick(10000);
      expect(stub.callCount, 'Job should have been executed on Monday 12th').to.equal(1);

      clock.tick(1000 * 60 * 60 * 24); // 24 hours later
      expect(stub.callCount, 'Job should have been executed on Tuesday 13th').to.equal(2);

      clock.tick(1000 * 60 * 60 * 24); // 24 hours later
      expect(stub.callCount, 'Job should have been executed on Wednesday 14th').to.equal(3);

      clock.tick(1000 * 60 * 60 * 24); // 24 hours later
      expect(stub.callCount, 'Job should have been executed on Thursday 15th').to.equal(4);

      clock.tick(1000 * 60 * 60 * 24); // 24 hours later
      expect(stub.callCount, 'Job should have been executed on Friday 16th').to.equal(5);

      clock.tick(1000 * 60 * 60 * 24); // 24 hours later
      expect(stub.callCount, 'Job should not have been executed on Saturday 17th').to.equal(5);

      clock.tick(1000 * 60 * 60 * 24); // 24 hours later
      expect(stub.callCount, 'Job should not have been executed on Sunday 18th').to.equal(5);

      clock.restore();
    });

    describe('Error handling', () => {
      let loggerStub;
      let loggerRevert;

      beforeEach(() => {
        stub.throws('Error test');
        loggerStub = sinon.stub();
        loggerRevert = __set__('logger', {
          warn: loggerStub,
        });
      });

      it('should log if an error occurs', () => {
        const clock = sinon.useFakeTimers(new Date(moment.tz('2018-02-12 15:59:59', 'Europe/Luxembourg')));
        scheduleJob();
        clock.tick(10000);
        clock.restore();

        expect(loggerStub.callCount).to.be.greaterThan(0);
      });

      afterEach(() => {
        loggerRevert();
      });
    });

    afterEach(() => {
      revert();
    });
  });
});
