const http = require('http');
const { expect } = require('chai');
const mockfs = require('mock-fs');
const fs = require('fs');
const path = require('path');
const server = require('../src/server');

const port = '1343';
let instance;

describe('server', () => {
  before(() => {
    instance = server.listen(port);
  });

  beforeEach(() => {
    const mockData = fs.readFileSync(path.join(__dirname, '/test-exchangerates.csv'), 'utf8');

    mockfs({
      './data/eurofxref-hist.csv': mockData,
    });
  });

  it('should return 200', (done) => {
    http.get('http://localhost:1343/ping', (res) => {
      expect(res.statusCode).to.equal(200);
      done();
    });
  });

  it('should return data', (done) => {
    http.get('http://localhost:1343/exchangeRates?period=THREE_MONTHS&currency=SEK&referenceCurrency=USD', (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        expect(JSON.parse(data)).to.deep.equal([{
          date: '2018-02-09',
          currency: 'SEK',
          referenceCurrency: 'USD',
          exchangeRate: 0.12341122998954226,
          totalAmountExchangeRate: 0.12341122998954226,
        }]);
        done();
      });
    });
  });

  afterEach(() => {
    mockfs.restore();
  });

  after(() => {
    instance.close();
  });
});
