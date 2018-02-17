# salary-exchange-api [![Build Status](https://travis-ci.org/GitHug/salary-exchange-api.svg?branch=master)](https://travis-ci.org/GitHug/salary-exchange-api)

API for client with server-side caching to check the value of your salary in another currency. The exchange rate is downloaded every weekday from the European Central Bank at 16:00, which is around the time it is made available. 

Example query to get the exchange rate for £4000 in USD since 2018-02-16. If there are no such exchange date, because the date is on a weekend for example, then it takes the next closest date instead.
```
{
  exchangeRates(
    sinceDate: "2018-02-16",
	  currency: "GBP",
	  referenceCurrency: "USD",
	  amount: 4000) {
      date,
      currency,
      referenceCurrency,
      exchangeRate,
      totalAmountExchangeRate
  }
}
```

Example response. The exchangeRate is for 1 GBP in USD while the totalAmountExchangeRate is the calculated rate from the amount in the query.
```
{
  "data": {
    "exchangeRates": [
      {
        "date": "2018-02-16",
        "currency": "GBP",
        "referenceCurrency": "USD",
        "exchangeRate": 1.4035561861648818,
        "totalAmountExchangeRate": 5614.2247446595275
      }
    ]
  }
}
```

further API documentation at 
```
/graphiql
```

Branch  | Status
------- | -------------
master  | [![Build Status](https://travis-ci.org/GitHug/salary-exchange-api.svg?branch=master)](https://travis-ci.org/GitHug/salary-exchange-api)
develop | [![Build Status](https://travis-ci.org/GitHug/salary-exchange-api.svg?branch=develop)](https://travis-ci.org/GitHug/salary-exchange-api)

