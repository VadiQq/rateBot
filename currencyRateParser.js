const https = require('https')
const url_parser = require('url')
const querystring = require('querystring');
const DOMParser = require('xmldom').DOMParser;

const lazyParserErrorHandler = {
    warning: () => { }
}
const defaultCompareCurrency = 'UAH';
const exchangeRateUrl = 'https://www.xe.com/currencytables/?from=';

const parseCurrencyTable = (currencyLiteralCode, table) => {
    const tableRows = table.getElementsByTagName('tr');

    const result = [];
    for (let i = 1; i < tableRows.length; i++) {
        const rowCells = tableRows[i].getElementsByTagName('td');
        if (rowCells['0'].firstChild.firstChild.data === currencyLiteralCode) {
            const currencyLink = rowCells[0].getElementsByTagName('a');
            const currencyData = {
                currencyCode: currencyLink[0].textContent,
                currencyUrl: currencyLink[0].getAttribute('href'),
                currencyName: rowCells['1'].firstChild.data,
                currencyRate: rowCells['3'].firstChild.data
            }

            return currencyData;
        }
    }
};

const getCurrencyRate = (currencyLiteralCode, currencyToCompareTo, resultHandleFunction) => {
    const compareCurrency = typeof (currencyToCompareTo) !== 'string' ? defaultCompareCurrency : currencyToCompareTo;
    const url = `${exchangeRateUrl}${compareCurrency}`;
    https.request(url, (res) => {
        let page = '';
        res.on('data', (chunk) => {
            page += chunk;
        });
        res.on('end', () => {
            const doc = new DOMParser({ errorHandler: lazyParserErrorHandler }).parseFromString(page);
            const table = doc.getElementById('historicalRateTbl');
            const rate = parseCurrencyTable(currencyLiteralCode, table);
            rate.currencyCompare = compareCurrency;
            resultHandleFunction(rate);
        });
    }).end();
}

module.exports = (currencyToLookFor, currencyToCompareTo, resultHandleFunction, errorHandleFunction) => {
    const rateData = typeof (currencyToCompareTo) !== 'string' ? getCurrencyRate(currencyToLookFor, null, resultHandleFunction)
        : getCurrencyRate(currencyToLookFor, currencyToCompareTo, resultHandleFunction);
}
