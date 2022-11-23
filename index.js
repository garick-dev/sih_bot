const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();
const text = require('./common_commands');
const DEFAULT_CONSTANTS = require('./constants');
const axios = require('axios');
let TIMER_PUSH_GAMES = Date.now();
const TIMER =  10 * 60 * 1000;


const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) =>  {
  ctx.replyWithHTML(`Добро пожаловать ${ctx.message.from.first_name ? ctx.message.from.first_name : 'Незнакомец'} 👋 Я тестовый бот\n\n 👇 У меня есть интересные команды, которыми ты можешь воспользоваться: 👇\n ${text.commands}\n 💬 Я пока могу тебе ответить на твоё сообщение только если ты напишешь "Привет" или отправишь мне стикер 💬\n\n ❗️❗️❗️ А также каждые 10 минут, я буду тебе присылать информацию об играх, тебе стоит только выбрать 😉`, Markup.inlineKeyboard(
      [
        [
          Markup.button.callback('Подписаться', 'subscibe_btn'),
          Markup.button.callback('Не подписываться', 'unsubscibe_btn'),
        ]
      ]
  ));
  addNicknameToGlobal(ctx);

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
        DEFAULT_CONSTANTS.COUNTRY_LIST_CODE.map((text,index) => {
        const arrLocal = [];
        if (index % 3 !== 0 || index === 0) {
          arr.push(Markup.button.callback(DEFAULT_CONSTANTS.COUNTRY_LIST_RU[index], `btn_${index}`));
        }
        if (index % 3 === 0 && index !== 0) {
          arrLocal.push(...arr);
          arr.length = 0;
          arr.push(Markup.button.callback(DEFAULT_CONSTANTS.COUNTRY_LIST_RU[index], `btn_${index}`));
        }
        return arrLocal;
      })
    ));
  }
  catch (e) {
    console.log(e);
  }

});

bot.command('subscribe', async (ctx) => {
  try {
   await addSubscribeUser(ctx);
    ctx.replyWithHTML(`<b>🎊 Вы подписались на уведомления 🎊</b>`);
  }
  catch (e) {
    console.log(e);
  }
});

bot.command('unsubscribe', async (ctx) => {
  try {
   removeSubscribedUser(ctx);
   ctx.replyWithHTML(`<b>Вы отписались от уведомлений 😔</b>`);
  }
  catch (e) {
    console.log(e);
  }
});

function addNicknameToGlobal (ctx) {
  const nickName = ctx.message.from.username;
  if (!DEFAULT_CONSTANTS.NICKNAME_USERS.includes(nickName)) {
    DEFAULT_CONSTANTS.NICKNAME_USERS.push(nickName);
  }
  console.log(DEFAULT_CONSTANTS.NICKNAME_USERS);
}

function addActionBot (name, buttonIndex) {
  bot.action(name, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      for (const countryName of DEFAULT_CONSTANTS.COUNTRY_LIST_CODE) {
        const index = DEFAULT_CONSTANTS.COUNTRY_LIST_CODE.indexOf(countryName);
        if (buttonIndex === index) {
          await getUniversities(DEFAULT_CONSTANTS.COUNTRY_LIST_CODE[index], (data) => {
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

function addActionOnSubscribe (name) {
  bot.action(name, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await addSubscribeUser(ctx);
      ctx.replyWithHTML(`<b>🎊 Вы подписались на уведомления 🎊</b>`);
    }
    catch (e) {
      console.log(e);
    }
  });
}

async function addSubscribeUser(ctx) {
  try {
    const userId = ctx.update.callback_query ? ctx.update.callback_query.from.id : ctx.update.message.from.id;
    if (!DEFAULT_CONSTANTS.SUBSCRIBED_USERS.includes(userId)) {
      DEFAULT_CONSTANTS.SUBSCRIBED_USERS.push(userId);
      await checkTimerAlarm(ctx);
    }
  }
  catch (e) {
    console.log(e);
  }
}

function removeSubscribedUser(ctx) {
  try {
    const userId = ctx.update.callback_query ? ctx.update.callback_query.from.id : ctx.update.message.from.id;
    const index = DEFAULT_CONSTANTS.SUBSCRIBED_USERS.findIndex((val) => val === userId);
    if (index !== -1) {
      DEFAULT_CONSTANTS.SUBSCRIBED_USERS = DEFAULT_CONSTANTS.SUBSCRIBED_USERS.slice(index, 0);
    }
  }
  catch (e) {
    console.log(e);
  }
}

function addActionOnUnsubscribe (name) {
  bot.action(name, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      removeSubscribedUser(ctx);
      ctx.replyWithHTML(`<b>Вы отписались от уведомлений 😔</b>`);
    }

    catch (e) {
      console.log(e);
    }
  });
}

function addListenersForButtons() {
  for (let i = 0; i <= DEFAULT_CONSTANTS.COUNTRY_LIST_CODE.length; i++) {
    addActionBot(`btn_${i}`, i);
  }

}

addActionOnSubscribe('subscibe_btn')
addActionOnUnsubscribe('unsubscibe_btn');
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

async function setGamesList() {
  try {
    const url = 'https://free-to-play-games-database.p.rapidapi.com/api/games';
    const options = {
      headers: {
        'X-RapidAPI-Key': 'afb1065580msh14a586629eb87bdp1776bcjsn8e695cc15b53',
        'X-RapidAPI-Host': 'free-to-play-games-database.p.rapidapi.com'
      },
      params: { platform: 'pc' },
    };
   const { data } = await axios.get(url, options);
   DEFAULT_CONSTANTS.GAMES_LIST.push(...data);
  }
  catch (e) {
    console.log(e);
  }
}

function renderHTMLGame (ctx) {
  try {
    const data = DEFAULT_CONSTANTS.GAMES_LIST;

    if (DEFAULT_CONSTANTS.GAMES_IDS.length === DEFAULT_CONSTANTS.GAMES_LIST.length) {
      DEFAULT_CONSTANTS.GAMES_IDS.length = 0;
    }

    for (let key in data) {
      if (!DEFAULT_CONSTANTS.GAMES_IDS.includes(data[key].id)) {
        DEFAULT_CONSTANTS.GAMES_IDS.push(data[key].id);
        const html = `<b>Информация об игре:</b>\n Имя: - <b>${data[key].title}</b>\n Жанр - <b>${data[key].genre}</b>\n Платформа - <b>${data[key].platform}</b>\n Разработчик - <b>${data[key].developer}</b>\n Дата релиза - <b>${data[key].release_date}</b>\n Описание - <b>${data[key].short_description}</b>\n ${data[key].game_url}`
        ctx.replyWithHTML(html);
        return;
      }
    }
  }
  catch (e) {
    console.log(e);
  }
}

async function checkTimerAlarm(ctx) {
  try {
    await setGamesList();
    const userId = ctx.update.callback_query ? ctx.update.callback_query.from.id : ctx.update.message.from.id;
    setInterval( () => {
      if (Date.now() - TIMER_PUSH_GAMES >= TIMER && DEFAULT_CONSTANTS.SUBSCRIBED_USERS.includes(userId)) {
        TIMER_PUSH_GAMES = Date.now();
        renderHTMLGame(ctx);
      }
    }, 5000)
  } catch (e) {
    console.log(e);
  }
}

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));