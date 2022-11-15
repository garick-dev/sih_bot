const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();
const text = require('./common_commands');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) =>  {
  ctx.reply(`Привет ${ctx.message.from.first_name ? ctx.message.from.first_name : 'Незнакомец'}`)
  console.log(ctx.message)
});
bot.on('sticker', (ctx) => ctx.reply('😉'));
bot.hears('Привет', (ctx) => ctx.reply(`И тебе привет ${ctx.message.from.first_name ? ctx.message.from.first_name : 'Незнакомец'}`));
bot.help((ctx) => ctx.reply(text.commands));

bot.command('stat', async (ctx) => {
  try {
    await ctx.replyWithHTML('<b>Статистика</b>', Markup.inlineKeyboard(
        [
          [Markup.button.callback('Игра_1', 'btn_1'), Markup.button.callback('Игра_2', 'btn_2')],
          [Markup.button.callback('Игра_3', 'btn_3')]
        ]
    ));
  }
  catch (e) {
    console.log(e);
  }

});

function addActionBot (name, src, text) {
  bot.action(name, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      if (src !== false) {
        await ctx.replyWithPhoto({
          source: src
        })
      }
      await ctx.replyWithHTML(text, {
        disable_web_page_preview : true
      });
    }
    catch (e) {
      console.log(e);
    }
  });
}

addActionBot('btn_1', false, text.text1);
addActionBot('btn_2', false, text.text2);
addActionBot('btn_3', false, text.text3);


bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));