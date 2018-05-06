const { fetchRates, fetchRateForDate } = require('./fetchHistoricalExchangeRates');

const getExchangeRate = async (period, date, currencyFrom, currencyTo) => {
  let historicalExchangeRate;
  let currentExchangeRate;

  if (period) {
    const historicalExchangeRates = await fetchRates(period, currencyFrom, currencyTo);
    const currentExchangeRates = await fetchRates(null, currencyFrom, currencyTo);

    [historicalExchangeRate] = historicalExchangeRates;
    [currentExchangeRate] = currentExchangeRates;
  } else if (date) {
    historicalExchangeRate = await fetchRateForDate(date, currencyFrom, currencyTo);
    currentExchangeRate = await fetchRateForDate(null, currencyFrom, currencyTo);
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
