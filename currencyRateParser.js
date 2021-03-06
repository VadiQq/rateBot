const https = require('https')
const config = require('./config.json');
const DOMParser = require('xmldom').DOMParser;

const lazyParserErrorHandler = {
    warning: () => { }
}
const defaultCompareCurrency = 'UAH';
const exchangeRateUrl = config.exchangeRateUrl;

const parseCurrencyTable = (currencyLiteralCode, table) => {
    if(table !== null){
        const tableRows = table.getElementsByTagName('tr');
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
    }
    
    return null;
};

const getCurrencyRate = (currencyLiteralCode, currencyToCompareTo, resultHandleFunction, errorHandleFunction) => {
    const compareCurrency = typeof (currencyToCompareTo) !== 'string' ? defaultCompareCurrency : currencyToCompareTo;
    const url = `${exchangeRateUrl}${compareCurrency}`;
    https.request(url, (response) => {
        let page = '';
        response.on('data', (chunk) => {
            page += chunk;
        });
        response.on('end', () => {
            const doc = new DOMParser({ errorHandler: lazyParserErrorHandler }).parseFromString(page);
            const table = doc.getElementById('historicalRateTbl');
            const rate = parseCurrencyTable(currencyLiteralCode, table);
            if (rate !== null) {
                rate.currencyCompare = compareCurrency;
                resultHandleFunction(rate);
            }
            else {
                errorHandleFunction('No matches found');
            }
        });
    }).end();
}

module.exports = (currencyToLookFor, currencyToCompareTo, resultHandleFunction, errorHandleFunction) => {
    const rateData = typeof (currencyToCompareTo) !== 'string' ? getCurrencyRate(currencyToLookFor, null, resultHandleFunction, errorHandleFunction)
        : getCurrencyRate(currencyToLookFor, currencyToCompareTo, resultHandleFunction, errorHandleFunction);
}
