const { CronJob } = require('cron');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const { downloader } = require('./downloader');
const logger = require('./logger');

/**
 * Downloads initial data if no data exists
 */
const initialDataDownload = () => {
  const dirPath = [__dirname, '..', '..', 'data'];
  const filePath = [...dirPath, 'eurofxref-hist.csv'];

  const jsonFilePath = path.join(...filePath);
  fs.access(jsonFilePath, (err) => {
    if (err) {
      logger.warn(err);
      logger.info(`No exchange rate data exists at ${JSON.stringify(jsonFilePath)}`);
      const jsonDirPath = path.join(...dirPath);
      fs.access(jsonDirPath, (dirErr) => {
        if (dirErr) {
          logger.info(`Creating directory ${JSON.stringify(jsonDirPath)}`);
          fs.mkdirSync(jsonDirPath);
        }
        downloader.fetchHistoricalRates();
      });
    }
  });
};

const scheduleJob = () => {
  initialDataDownload();

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
