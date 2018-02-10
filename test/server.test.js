const http = require('http');
const { expect } = require('chai');
const server = require('../src/server');

const port = '1343';
let instance;

describe('server', () => {
  before(() => {
    instance = server.listen(port);
  });

  it('should return 200', (done) => {
    http.get('http://localhost:1343/exchangeRates', (res) => {
      expect(res.statusCode).to.equal(200);
      done();
    });
  });

  it('should return data', (done) => {
    http.get('http://localhost:1343/exchangeRates?sinceDate=2018-02-09&currency=SEK&referenceCurrency=USD', (res) => {
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
        }]);
        done();
      });
    });
  });

  after(() => {
    instance.close();
  });
});
