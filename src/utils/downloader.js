const fstream = require('fstream');
const https = require('https');
const cheerio = require('cheerio');
const request = require('request');
const unzip = require('unzip');
const schedule = require('node-schedule');

const fetchHref = (selector, resolve, reject) => {
  const url = 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html';
  request({
    uri: url,
  }, (error, response, body) => {
    if (error) {
      reject(error.message);
      return;
    } else if (response.statusCode !== 200) {
      reject(response.message);
      return;
    }
    const $ = cheerio.load(body);

    const link = $(selector);

    const host = 'https://www.ecb.europa.eu';

    if (!link.attr('href')) {
      reject(new Error('href not found'));
    }

    const fullPath = host + link.attr('href');
    resolve(fullPath);
  });
};

const fetchCurrentRatesHref = () => new Promise((resolve, reject) => {
  const selector = 'h4:contains(Current reference rates) + ul a.download';
  fetchHref(selector, resolve, reject);
});

const fetchHistoricalRatesHref = () => new Promise((resolve, reject) => {
  const selector = 'p:contains(Time series) + ul a.download';
  fetchHref(selector, resolve, reject);
});

const download = url => new Promise((resolve, reject) => {
  https.get(url, (response) => {
    resolve(response);
  }).on('error', (err) => {
    reject(err.message);
  });
});

const unpackage = stream => new Promise((resolve, reject) => {
  let path = './data/';

  const writer = fstream.Writer('data');
  writer.on('close', () => {
    resolve(path);
  });
  writer.on('error', (err) => {
    reject(err.message);
  });

  const parser = unzip.Parse();
  parser.on('entry', (file) => {
    path += file.path;
  });
  parser.on('error', (err) => {
    reject(err.message);
  });

  try {
    stream
      .pipe(parser)
      .pipe(writer);
  } catch (err) {
    reject(err.message);
  }
});

const fetchECBRates = hrefFunc =>
  hrefFunc()
    .then(url => download(url))
    .then(stream => unpackage(stream));

let jobSchedule;
const scheduleJob = () => {
  const rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [0, new schedule.Range(0, 4)];
  rule.hour = 16;
  rule.minute = 0;

  jobSchedule = schedule.scheduleJob(rule, () => {
    fetchECBRates(fetchHistoricalRatesHref);
  });

  return jobSchedule;
};

const cancelScheduledJob = () => {
  if (jobSchedule) {
    jobSchedule.cancel();
  }
};

const cli = (args) => {
  let ret;

  (args || process.argv).forEach((argv) => {
    switch (argv) {
      case 'daily':
        fetchECBRates(fetchCurrentRatesHref);
        break;
      case 'historical':
        fetchECBRates(fetchHistoricalRatesHref);
        break;
      case 'all':
        fetchECBRates(fetchCurrentRatesHref);
        fetchECBRates(fetchHistoricalRatesHref);
        break;
      case 'schedule':
        ret = scheduleJob();
        break;
      case 'stop-schedule':
        cancelScheduledJob();
        break;
      default:
    }
  });

  return ret;
};

const downloader = {
  fetchCurrentRates: () => fetchECBRates(fetchCurrentRatesHref),
  fetchHistoricalRates: () => fetchECBRates(fetchHistoricalRatesHref),
};

module.exports = {
  downloader,
  cli,
};
