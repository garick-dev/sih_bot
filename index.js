const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();
const text = require('./common_commands');
const axios = require('axios');

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

bot.command('random', async (ctx) => {
  try {
    const url = 'https://randomuser.me/api/';
    const { data } = await axios.get(url);
    ctx.reply(`You get random user: Gender - ${data.results[0].gender}, first name - ${data.results[0].name.first}, last name - ${data.results[0].name.last}, age - ${data.results[0].dob.age}, email - ${data.results[0].email}, ${data.results[0].picture.medium}`);
  }
  catch (e) {
    console.log(e);
  }
})

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