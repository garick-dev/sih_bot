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
    const arr = [];
    await ctx.replyWithHTML('<b>Выберите страну для получения списка топ 5 университетов</b>', Markup.inlineKeyboard(
        COUNTRY_LIST.COUNTRY_LIST_CODE.map((text,index) => {
        const arrLocal = [];
        if (index % 3 !== 0 || index === 0) {
          arr.push(Markup.button.callback(COUNTRY_LIST.COUNTRY_LIST_RU[index], `btn_${index}`));
        }
        if (index % 3 === 0 && index !== 0) {
          arrLocal.push(...arr);
          arr.length = 0;
          arr.push(Markup.button.callback(COUNTRY_LIST.COUNTRY_LIST_RU[index], `btn_${index}`));
        }
        return arrLocal;
      })
    ));
  }
  catch (e) {
    console.log(e);
  }

});

function addActionBot (name, buttonIndex) {
  bot.action(name, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      for (const countryName of COUNTRY_LIST.COUNTRY_LIST_CODE) {
        const index = COUNTRY_LIST.COUNTRY_LIST_CODE.indexOf(countryName);
        if (buttonIndex === index) {
          await getUniversities(COUNTRY_LIST.COUNTRY_LIST_CODE[index], (data) => {
            renderHTML(data, ctx);
          });
        }
      }
    }
    catch (e) {
      console.log(e);
    }
  });
}

function addListenersForButtons() {
  for (let i = 0; i <= COUNTRY_LIST.COUNTRY_LIST_CODE.length; i++) {
    addActionBot(`btn_${i}`, i);
  }

}

addListenersForButtons();

async function getUniversities(countryCode, cb) {
  try {
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