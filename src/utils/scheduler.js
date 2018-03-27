const { CronJob } = require('cron');
const downloader = require('./downloader');
const logger = require('./logger');
const moment = require('moment');

const scheduleJob = () => {
  const job = new CronJob({
    cronTime: '0 16 * * 1-5',
    onTick: async () => {
      try {
        logger.info(`Job executed on ${moment()}`);
        await downloader.fetchHistoricalRates();
      } catch (err) {
        logger.warn('Scheduled job failed');
        logger.warn(err);
      }
    },
    start: true,
    timeZone: 'Europe/Luxembourg',
  });
  return job;
};

module.exports = {
  scheduleJob,
};
