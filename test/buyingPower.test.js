const chai = require('chai');
const rewire = require('rewire');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const { expect } = chai;

const buyingPower = rewire('../src/buyingPower');

describe('buyingPower', () => {
  it('should throw an error if both period and date is missing', () =>
    expect(buyingPower.fetchBuyingPower()).to.eventually.be.rejectedWith(Error));
});

