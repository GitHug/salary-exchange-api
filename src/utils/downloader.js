const fstream = require('fstream');
const https = require('https');
const cheerio = require('cheerio');
const request = require('request');
const unzip = require('unzip');

const fetchHref = (selector, resolve, reject) => {
  const url = 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html';
  request({
    uri: url,
  }, (error, response, body) => {
    if (!response) {
      reject(error.message);
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

  const parser = unzip.Parse();
  parser.on('entry', (file) => {
    path += file.path;
  });

  try {
    stream
      .pipe(parser)
      .pipe(writer);
  } catch (err) {
    reject(err.message);
  }
});

const fetchRates = (hrefFunc) => {
  hrefFunc()
    .then(url => download(url))
    .then(stream => unpackage(stream));
};

process.argv.forEach((argv) => {
  switch (argv) {
    case 'daily':
      fetchRates(fetchCurrentRatesHref);
      break;
    case 'historical':
      fetchRates(fetchHistoricalRatesHref);
      break;
    case 'all':
      fetchRates(fetchCurrentRatesHref);
      fetchRates(fetchHistoricalRatesHref);
      break;
    default:
  }
});
