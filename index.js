const Telegraf = require('telegraf');
const config = require('./config.json');
const parser = require('./currencyRateParser.js')
const request = require('request');
const bot = new Telegraf(config.token, { webhookReply: true });

bot.hears(/\/start/, async (ctx) => {
    return await ctx.reply(`Type /rate CUR (currency literal code) to get daily exchange rate to UAH`).then(() => {
        return await ctx.reply(`Type /rate CUR-CMP (currency literal code)-(compare currency code) to get daily exchange rate to specific currency`);
    });
});

bot.hears(/\/help/, async (ctx) => {
    return await ctx.reply(`Type /rate CUR (currency literal code) to get daily exchange rate to UAH`).then(() => {
        return await ctx.reply(`Type /rate CUR-CMP (currency literal code)-(compare currency code) to get daily exchange rate to specific currency`);
    });
});

bot.on('sticker', async (ctx) => {
    return await ctx.reply('Nice one!').then(() => { return await ctx.reply('Really nice') });
});

bot.hears(/^\/rate [a-zA-Z]{3}$/, async (ctx) => {
    var currencyLetterCode = ctx.match.input.split(' ')[1].toUpperCase();
    await parser(currencyLetterCode, null,
        (result) => {
            ctx.reply(setupAnswer(result), { parse_mode: 'HTML', disable_web_page_preview: true, reply_to_message_id: ctx.message.message_id });
        },
        (error) => {
            ctx.reply(error, { reply_to_message_id: ctx.message.message_id });
        }
    );
});

bot.hears(/^\/rate [a-zA-Z]{3}\-[a-zA-Z]{3}$/, async (ctx) => {
    var requestData = ctx.match.input.split(' ')[1].split('-');
    var currencyLetterCode = requestData[0].toUpperCase();
    var currencyCompare = requestData[1].toUpperCase();
    ctx.reply(`Looking for ${currencyLetterCode} exchange rate to ${currencyCompare}`).then(() => {
        await parser(currencyLetterCode, currencyCompare,
            (result) => {
                ctx.reply(setupAnswer(result), { parse_mode: 'HTML', disable_web_page_preview: true, reply_to_message_id: ctx.message.message_id });
            },
            (error) => {
                ctx.reply(error, { reply_to_message_id: ctx.message.message_id });
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
            res.end(200);
        });
    }
    else {
        res.end(400);
    }
};