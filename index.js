const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();
const text = require('./common_commands');
const COUNTRY_LIST = require('./constants');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) =>  {
  ctx.reply(`Привет ${ctx.message.from.first_name ? ctx.message.from.first_name : 'Незнакомец'}`)
  console.log(ctx.message)
});
bot.on('sticker', (ctx) => ctx.reply('😉'));
bot.hears('Привет', (ctx) => ctx.reply(`И тебе привет ${ctx.message.from.first_name ? ctx.message.from.first_name : 'Незнакомец'}`));
bot.help((ctx) => ctx.reply(text.commands));

// bot.command('stat', async (ctx) => {
//   try {
//     await ctx.replyWithHTML('<b>Статистика</b>', Markup.inlineKeyboard(
//         [
//           [Markup.button.callback('Игра_1', 'btn_1'), Markup.button.callback('Игра_2', 'btn_2')],
//           [Markup.button.callback('Игра_3', 'btn_3')]
//         ]
//     ));
//   }
//   catch (e) {
//     console.log(e);
//   }
// });

bot.command('random', async (ctx) => {
  try {
    const url = 'https://randomuser.me/api/';
    const { data } = await axios.get(url);
    ctx.replyWithHTML(`You get random user: \nGender - <b>${data.results[0].gender}</b>\nFirst name - <b>${data.results[0].name.first}</b>\nLast name - <b>${data.results[0].name.last}</b>\nAge - <b>${data.results[0].dob.age}</b>\nCountry - <b>${data.results[0].location.country}</b>\nCity - <b>${data.results[0].location.city}</b>\nPhone - <b>${data.results[0].phone}</b>\nEmail - ${data.results[0].email} ${data.results[0].picture.large}`);
  }
  catch (e) {
    console.log(e);
  }
});

bot.command('universities', async (ctx) => {
  try {
    await ctx.replyWithHTML('<b>Выберите страну для получения списка топ 5 университетов</b>', Markup.inlineKeyboard(
        [
          [Markup.button.callback('Россия', 'btn_0'), Markup.button.callback('Украина', 'btn_1'), Markup.button.callback('США', 'btn_2')],
          [Markup.button.callback('Беларусь', 'btn_3'), Markup.button.callback('Казахстан', 'btn_4'), Markup.button.callback('Кыргызстан', 'btn_5')],
          [Markup.button.callback('Таджикистан', 'btn_6'), Markup.button.callback('Армения', 'btn_7'), Markup.button.callback('Узбекистан', 'btn_8')],
        ]
    ));
  }
  catch (e) {
    console.log(e);
  }

});

function addActionBot (name) {
  bot.action(name, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      switch (name) {
        case 'btn_0':
          await getUniversities(COUNTRY_LIST[0], (data) => {
            renderHTML(data, ctx);
          });
        break;
        case 'btn_1':
          await getUniversities(COUNTRY_LIST[1], (data) => {
            renderHTML(data, ctx);
          });
        break;
        case 'btn_2':
          await getUniversities(COUNTRY_LIST[2], (data) => {
            renderHTML(data, ctx);
          });
        break;
        case 'btn_3':
          await getUniversities(COUNTRY_LIST[3], (data) => {
            renderHTML(data, ctx);
          });
        break;
        case 'btn_4':
          await getUniversities(COUNTRY_LIST[4], (data) => {
            renderHTML(data, ctx);
          });
        break;
        case 'btn_5':
          await getUniversities(COUNTRY_LIST[5], (data) => {
            renderHTML(data, ctx);
          });
        break;
        case 'btn_6':
          await getUniversities(COUNTRY_LIST[6], (data) => {
            renderHTML(data, ctx);
          });
        break;
        case 'btn_7':
          await getUniversities(COUNTRY_LIST[7], (data) => {
            renderHTML(data, ctx);
          });
        break;
        case 'btn_8':
          await getUniversities(COUNTRY_LIST[8], (data) => {
            renderHTML(data, ctx);
          });
        break;
      }
    }
    catch (e) {
      console.log(e);
    }
  });
}
for (let i = 0; i <= COUNTRY_LIST.length; i++) {
  addActionBot(`btn_${i}`);
}



async function getUniversities(countryCode, cb) {
  try {
    console.log(countryCode);
    const url = `http://universities.hipolabs.com/search?country=${countryCode}`;
    const { data } = await axios.get(url);
    let obj = {};
    for (let key in data) {
      if (key < 5) {
        if (!Object.keys(obj).length) {
         obj = Object.assign({}, { [key] : data[key] });
        }
        else {
         obj = Object.assign(obj, { [key] : data[key] });
        }
      }
    }
    return cb(obj);
  } catch (e) {
    console.log(e);
  }
}

function renderHTML(data, ctx) {
  let html = '';
  for (let key in data) {
    html += `Наименование: <b>${data[key].name}</b>\nСтрана: <b>${data[key].country}</b>\nСтраница: <b>${data[key].web_pages}</b>\n\n`;
  }
  ctx.replyWithHTML(html);
}


bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));