const { fetchAndUnzip } = require('../src/utils/unzipperFetcher');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const fs = require('fs');

chai.use(chaiAsPromised);
const { expect } = chai;

const url = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip?a2d77eae164a8b145a8bebdee30f19e3';

describe('unzipperFetcher', () => {
  it('should be able to fetch and unzip', async () => {
    nock('https://www.ecb.europa.eu')
      .get('/stats/eurofxref/eurofxref-hist.zip?a2d77eae164a8b145a8bebdee30f19e3')
      .replyWithFile(200, `${__dirname}/eurofxref.zip`, {
        'Content-Type': 'application/zip',
      });


    const file = await fetchAndUnzip(url);
    expect(file).to.be.equal('eurofxref.csv');
  });

  after(() => {
    if (fs.existsSync('data/eurofxref.csv')) {
      fs.unlinkSync('data/eurofxref.csv');
    }
  });
});

