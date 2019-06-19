const https = require('https')
const config = require('./config.json');
const DOMParser = require('xmldom').DOMParser;

const lazyParserErrorHandler = {
    warning: () => { }
}
const defaultCompareCurrency = 'UAH';
const exchangeRateUrl = config.exchangeRateUrl;

const parseCurrencyTable = (currencyLiteralCode, table) => {
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

    return null;
};

const getCurrencyRate = async (currencyLiteralCode, currencyToCompareTo, resultHandleFunction, errorHandleFunction) => {
    const compareCurrency = typeof (currencyToCompareTo) !== 'string' ? defaultCompareCurrency : currencyToCompareTo;
    const url = `${exchangeRateUrl}${compareCurrency}`;
    await https.request(url, (response) => {
        let page = '';
        response.on('data', (chunk) => {
            page += chunk;
        });
        response.on('end', () => {
            const doc = new DOMParser({ errorHandler: lazyParserErrorHandler }).parseFromString(page);
            const table = doc.getElementById('historicalRateTbl');
            if (table) {
                const rate = parseCurrencyTable(currencyLiteralCode, table);
                rate.currencyCompare = compareCurrency;
                resultHandleFunction(rate);
            } else {
                errorHandleFunction('No matches found');
            }

        });
    }).end();
}

module.exports = async (currencyToLookFor, currencyToCompareTo, resultHandleFunction, errorHandleFunction) => {
    const rateData = typeof (currencyToCompareTo) !== 'string' ? await getCurrencyRate(currencyToLookFor, null, resultHandleFunction)
        : await getCurrencyRate(currencyToLookFor, currencyToCompareTo, resultHandleFunction, errorHandleFunction);
}
