const Telegraf = require('telegraf');
const config = require('./config.json');
const parser = require('./currencyRateParser.js')
const request = require('request');
const requestClosed = false;
const bot = new Telegraf(config.token);
bot.telegram.setWebhook(config.webhook);
bot.hears(/\/start/, (ctx) => {
    return ctx.reply(`Type /rate CUR (currency literal code) to get daily exchange rate to UAH`).then(() => {
        return ctx.reply(`Type /rate CUR-CMP (currency literal code)-(compare currency code) to get daily exchange rate to specific currency`).then(() => {
            requestClosed = true;
        });
    });
});

bot.hears(/\/help/, (ctx) => {
    return ctx.reply(`Type /rate CUR (currency literal code) to get daily exchange rate to UAH`).then(() => {
        return ctx.reply(`Type /rate CUR-CMP (currency literal code)-(compare currency code) to get daily exchange rate to specific currency`).then(() => {
            requestClosed = true;
        });
    });
});

bot.on('sticker', (ctx) => {
    return ctx.reply('Nice one!').then(() => { return ctx.reply('Really nice') }).then(() => {
        requestClosed = true;
    });;
});

bot.hears(/^\/rate [a-zA-Z]{3}$/, (ctx) => {
    var currencyLetterCode = ctx.match.input.split(' ')[1].toUpperCase();
    parser(currencyLetterCode, null,
        (result) => {
            ctx.reply(setupAnswer(result), { parse_mode: 'HTML', disable_web_page_preview: true, reply_to_message_id: ctx.message.message_id }).then(() => {
                requestClosed = true;
            });
        },
        (error) => {
            ctx.reply(error, { reply_to_message_id: ctx.message.message_id }).then(() => {
                requestClosed = true;
            });;
        }
    );
});

bot.hears(/^\/rate [a-zA-Z]{3}\-[a-zA-Z]{3}$/, (ctx) => {
    var requestData = ctx.match.input.split(' ')[1].split('-');
    var currencyLetterCode = requestData[0].toUpperCase();
    var currencyCompare = requestData[1].toUpperCase();
    return ctx.reply(`Looking for ${currencyLetterCode} exchange rate to ${currencyCompare}`).then(() => {
        parser(currencyLetterCode, currencyCompare,
            (result) => {
                ctx.reply(setupAnswer(result), { parse_mode: 'HTML', disable_web_page_preview: true, reply_to_message_id: ctx.message.message_id }).then(() => {
                    requestClosed = true;
                });;
            },
            (error) => {
                ctx.reply(error, { reply_to_message_id: ctx.message.message_id }).then(() => {
                    requestClosed = true;
                });;
            }
        );
    });
});

bot.on('message', (ctx) => {
    ctx.reply('Unknown command', { reply_to_message_id: ctx.message.message_id })
})

const setupAnswer = (currencyData) => {
    if (currencyData !== null) {
        const replyMessage = `<a href="${currencyData.currencyUrl}">${currencyData.currencyCode}</a> exchange rate to ${currencyData.currencyCompare} is ${currencyData.currencyRate}`;
        return replyMessage;
    }
    else {
        return 'No matches found';
    }
}

module.exports = (req, res) => {
    if (req.body) {
        bot.handleUpdate(req.body, res).then(() => {
            while (true) {
                if (requestClosed) {
                    res.end(200, 'OK');
                }
            }
        });
    }
    else {
        res.end('Bad request');
    }
};