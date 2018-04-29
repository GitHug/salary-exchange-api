const { fetchRates, fetchRateForDate } = require('./db');

const getExchangeRate = async (period, date, currency, referenceCurrency) => {
  let historicalExchangeRate;
  let currentExchangeRate;

  if (period) {
    const historicalExchangeRates = await fetchRates(period, currency, referenceCurrency);
    const currentExchangeRates = await fetchRates(null, currency, referenceCurrency);

    [historicalExchangeRate] = historicalExchangeRates;
    [currentExchangeRate] = currentExchangeRates;
  } else if (date) {
    historicalExchangeRate = await fetchRateForDate(date, currency, referenceCurrency);
    currentExchangeRate = await fetchRateForDate(null, currency, referenceCurrency);
  } else {
    throw new Error('Both period and date can not be empty');
  }

  return { historicalExchangeRate, currentExchangeRate };
};

const calculatePercentage = (previousExchangeRate, currentExchangeRate) =>
  ((currentExchangeRate - previousExchangeRate) / previousExchangeRate);

const calculatePercentageFormatted = (previousExchangeRate, currentExchangeRate) =>
  (calculatePercentage(previousExchangeRate, currentExchangeRate) * 100).toFixed(2);

const calculateBuyingPower = (exchangeRate, amount) =>
  (exchangeRate * amount).toFixed(2);

const fetchBuyingPower = async (period, date, currency, referenceCurrency, amount) => {
  const { historicalExchangeRate, currentExchangeRate } =
    await getExchangeRate(period, date, currency, referenceCurrency);

  return {
    historicalExchangeRate,
    currentExchangeRate,
    difference: {
      rate: (currentExchangeRate.exchangeRate - historicalExchangeRate.exchangeRate).toFixed(4),
      ratePercentage:
        calculatePercentageFormatted(
          historicalExchangeRate.exchangeRate,
          currentExchangeRate.exchangeRate,
        ),
      sinceDate: historicalExchangeRate.date,
      latestDate: currentExchangeRate.date,
      originalBuyingPower: (amount &&
        calculateBuyingPower(historicalExchangeRate.exchangeRate, amount)),
      currentBuyingPower: (amount &&
        calculateBuyingPower(currentExchangeRate.exchangeRate, amount)),
    },
  };
};

module.exports = { fetchBuyingPower };
