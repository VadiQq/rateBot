const Telegraf = require('telegraf');
const config = require('./config.json');
const parser = require('./currencyRateParser.js')
const request = require('request');

const bot = new Telegraf(config.token, { setWebhook: true });

bot.hears(/\/start/, (ctx) => {
    return ctx.reply(`Type /rate CUR (currency literal code) to get daily exchange rate to UAH`).then(() => {
        return ctx.reply(`Type /rate CUR-CMP (currency literal code)-(compare currency code) to get daily exchange rate to specific currency`)
    });
});

bot.hears(/\/help/, (ctx) => {
    return ctx.reply(`Type /rate CUR (currency literal code) to get daily exchange rate to UAH`).then(() => {
        return ctx.reply(`Type /rate CUR-CMP (currency literal code)-(compare currency code) to get daily exchange rate to specific currency`)
    });
});

bot.hears(/\/test/, (ctx) => {
    ctx.reply('test2');
});

bot.hears(/\/test1/, (ctx) => {
    ctx.reply('test1');
    ctx.reply('test2');
});



bot.on('sticker', (ctx) => {
    return ctx.reply('Nice one!').then(() => { return ctx.reply('Really nice') });
});

bot.hears(/^\/rate [a-zA-Z]{3}$/, async (ctx) => {
    const sendMessageUrl = `https://api.telegram.org/bot${config.token}/sendMessage`;
    request.post({
        url: sendMessageUrl,
        method: 'post',
        body: {
            chat_id: ctx.chat.chatId,
            text: 'post request'
        },
        json: true
    },
        (error, response, body) => {
            console.log(body);
        }
    );
    var currencyLetterCode = ctx.match.input.split(' ')[1].toUpperCase();
    await parser(currencyLetterCode, null,
        async (result) => {
            await ctx.reply(setupAnswer(result), { parse_mode: 'HTML', disable_web_page_preview: true, reply_to_message_id: ctx.message.message_id });
        },
        async (error) => {
            await ctx.reply(error, { reply_to_message_id: ctx.message.message_id });
        }
    );
});

bot.hears(/^\/rate [a-zA-Z]{3}\-[a-zA-Z]{3}$/, (ctx) => {
    var requestData = ctx.match.input.split(' ')[1].split('-');
    var currencyLetterCode = requestData[0].toUpperCase();
    var currencyCompare = requestData[1].toUpperCase();
    parser(currencyLetterCode, currencyCompare,
        (result) => {
            ctx.reply(setupAnswer(result), { parse_mode: 'HTML', disable_web_page_preview: true, reply_to_message_id: ctx.message.message_id });
        },
        (error) => {
            ctx.reply(error, { reply_to_message_id: ctx.message.message_id });
        }
    );
});

bot.on('message', (ctx) => {
    ctx.reply('Unknown command', { reply_to_message_id: ctx.message.message_id })
})

const setupAnswer = (currencyData) => {
    const replyMessage = `<a href="${currencyData.currencyUrl}">${currencyData.currencyCode}</a> exchange rate to ${currencyData.currencyCompare} is ${currencyData.currencyRate}`;
    return replyMessage;
}

module.exports = (req, res) => {
    if (req.body) {
        bot.handleUpdate(req.body, res).then(() => {
            res.end('OK');
        });
    }
    else {
        res.end('Bad request');
    }
};