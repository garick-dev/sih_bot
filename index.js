const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();
const text = require('./common_commands');
const COUNTRY_LIST = require('./constants');
const axios = require('axios');
const HOTELS_CODE = [];
let TIMER_PUSH_HOTEL = Date.now();
const TIMER = 3 * 60 * 1000;


const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) =>  {
  ctx.replyWithHTML(`Добро пожаловать ${ctx.message.from.first_name ? ctx.message.from.first_name : 'Незнакомец'} 🎉🎉🎉 Я тестовый бот\n\n 👇 У меня есть интересные команды, которыми ты можешь воспользоваться: 👇\n ${text.commands}\n 💬 Я пока могу тебе ответить на твоё сообщение только если ты напишешь "Привет" или отправишь мне стикер 💬\n\n ❗️❗️❗️ А также каждые 3 минуты я буду тебе присылать информацию об отелях 😉`);
  // console.log(ctx.message);
  checkTimerAlarm(ctx);
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

async function getHotels(ctx) {
  try {
    const url = 'https://hotels4.p.rapidapi.com/v2/get-meta-data';
    const options = {
      headers: {
        'X-RapidAPI-Key': 'afb1065580msh14a586629eb87bdp1776bcjsn8e695cc15b53',
        'X-RapidAPI-Host': 'hotels4.p.rapidapi.com'
      }
    };
   const { data } = await axios.get(url, options);
   for (let key in data) {
     if (!HOTELS_CODE.includes(key)) {
       HOTELS_CODE.push(key);
       const html = `<b>Hotel information</b>\n Country Code - <b>${data[key].countryCode}</b>\n Time Format - <b>${data[key].timeFormat}</b>\n Web-site - <b>${data[key].supportedLocales[0].appInfoURL}\n</b> Picture - ${data[key].memberDealCardImageUrl ? data[key].memberDealCardImageUrl : ''}`
       ctx.replyWithHTML(html);
       return;
     }
   }
  }
  catch (e) {
    console.log(e);
  }
}

function checkTimerAlarm(ctx) {
  try {
    setInterval(async () => {
      if (Date.now() - TIMER_PUSH_HOTEL >= TIMER) {
        TIMER_PUSH_HOTEL = Date.now();
        await getHotels(ctx);
      }
    }, 5000)
  }
  catch (e) {
    console.log(e);
  }
}

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));