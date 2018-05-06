const http = require('http');
const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');
const server = require('../src/server');
const json = require('./rates.json');
const cache = require('../src/cache');
const permCache = require('../src/permCache');

const port = '1343';
let instance;
let clock;

describe('server', () => {
  before(() => {
    cache.init();
    permCache.init();
    instance = server.listen(port);
    clock = sinon.useFakeTimers(new Date('2018-05-04'));
  });

  it('should return 200', (done) => {
    http.get('http://localhost:1343/ping', (res) => {
      expect(res.statusCode).to.equal(200);
      done();
    });
  });

  it('should return data', (done) => {
    nock('http://localhost:49161')
      .get('/rates/historical')
      .reply(200, json);

    http.get('http://localhost:1343/exchangeRates?period=THREE_MONTHS&currencyFrom=SEK&currencyTo=USD', (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        expect(JSON.parse(data)).to.deep.equal([{
          currencyFrom: 'SEK',
          currencyTo: 'USD',
          date: '2018-05-02',
          exchangeRate: 0.11308794996891895,
          totalAmountExchangeRate: 0.11308794996891895,
        },
        {
          currencyFrom: 'SEK',
          currencyTo: 'USD',
          date: '2018-05-03',
          exchangeRate: 0.11308406808430384,
          totalAmountExchangeRate: 0.11308406808430384,
        },
        {
          currencyFrom: 'SEK',
          currencyTo: 'USD',
          date: '2018-05-04',
          exchangeRate: 0.11321950527361302,
          totalAmountExchangeRate: 0.11321950527361302,
        }]);
        done();
      });
    });
  });


  after(() => {
    instance.close();
    clock.restore();
    cache.reset();
    permCache.reset();
  });
});
