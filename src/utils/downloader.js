const fstream = require('fstream');
const https = require('https');
const cheerio = require('cheerio');
const rp = require('request-promise');
const unzip = require('unzipper');
const logger = require('./logger');

const findFileURL = async (selector) => {
  logger.info(`Fetch link to file with selector '${selector}'`);
  const host = 'https://www.ecb.europa.eu';
  const options = {
    uri: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html',
    transform: body => cheerio.load(body),
  };

  const fileURL = await rp(options)
    .then(($) => {
      const link = $(selector);
      if (!link.attr('href')) {
        throw new Error(`Href not found with selector ${selector}`);
      }

      return host + link.attr('href');
    })
    .catch((err) => {
      logger.warn(`Unable to find file URL due to: ${err.message}`);
      throw err;
    });

  logger.info(`File URL is ${fileURL}`);
  return fileURL;
};

const download = async (url) => {
  logger.info(`Preparing to download file at url ${url}`);

  const promise = new Promise((resolve, reject) =>
    https.get(url, async (response) => {
      logger.info('Download successful');
      resolve(response);
    }).on('error', (err) => {
      logger.warn(`Download failed with message ${err.message}`);
      reject(err);
    }));

  return promise;
};

const unpackage = async (stream) => {
  logger.info('Preparing to unpackage');

  if (!stream) throw new Error('Stream is missing...');
  let path = './data/';

  try {
    await new Promise((resolve, reject) => {
      const parser = unzip.Parse();
      parser.on('entry', (file) => {
        path += file.path;
      });
      parser.on('error', (err) => {
        logger.warn(`Parser failed: ${err.message}`);
      });

      const writer = fstream.Writer('data');
      writer.on('close', () => {
        resolve(path);
      });
      writer.on('error', (err) => {
        logger.warn(`Writer failed: ${err.message}`);
        reject(err);
      });

      stream
        .pipe(parser)
        .pipe(writer);
    });
  } catch (err) {
    logger.warn(`Unpackage failed: ${err.message}`);
    throw err;
  }

  logger.info(`File unpackaged at ${path}`);
  return path;
};

const fetchECBRates = async () => {
  try {
    const selector = 'p:contains(Time series) + ul a.download';
    const url = await findFileURL(selector);
    const stream = await download(url);
    return await unpackage(stream);
  } catch (err) {
    logger.warn('An error occured when fetching ECB rates');
    logger.warn(err.message);
    throw err;
  }
};

const downloader = {
  fetchHistoricalRates: () => fetchECBRates(),
};

module.exports = {
  downloader,
};
