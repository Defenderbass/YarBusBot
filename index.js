const
   TelegramBot = require('node-telegram-bot-api'),
   cfg = require('./src/config'),
   local = false,
   token = '',
   bot = new TelegramBot(cfg.getToken(token), cfg.getBotOptions(local)),
   helpers = require('./src/helpers.js'),
   helloText = 'Hello! Just write /bus and enjoy :)';

bot.onText(/\/start/, (msg) => {
   bot.sendMessage(msg.chat.id, helloText);
});

bot.onText(/\/gohome/, (msg) => {
   helpers.prepareText([78, 1, 424], msg, 1)
      .then(msg => bot.sendMessage(msg.chat.id, msg));
});

bot.onText(/\/gowork/, (msg) => {
   helpers.prepareText([78, 0, 47], msg, 1)
      .then(msg => bot.sendMessage(msg.chat.id, msg));
});

bot.onText(/\/bus/, (msg) => {
   let
      bus, way, station, chatId, wayString, transport, transportId, data;
   helpers.generateOptions()
      .then(options => bot.sendMessage(msg.chat.id, 'Выбери транспорт', options))
      .then(() => helpers.getOnceEventPromise(bot, 'callback_query'))
      .then(msg => {
         transport = msg.data;
         chatId = msg.message.chat.id;
         switch (transport) {
            case 'Автобус':
               transportId = 1;
               break;
            case 'Троллейбус':
               transportId = 2;
               break;
            default:
               transportId = 3;
               break;
         }
         bot.editMessageText(`Выбран ${transport}`, helpers.getEditParams(msg));
         return helpers.generateOptions(transportId);
      })
      .then(options => bot.sendMessage(chatId, 'Выбери номер', options))
      .then(() => helpers.getOnceEventPromise(bot, 'callback_query'))
      .then((msg) => {
         bus = msg.data;
         bot.editMessageText(`Выбран №${bus}`, helpers.getEditParams(msg));
         return helpers.generateOptions(transportId, bus);
      })
      .then(options => bot.sendMessage(chatId, 'Выбери направление', options))
      .then(() => helpers.getOnceEventPromise(bot, 'callback_query'))
      .then(msg => {
         data = JSON.parse(msg.data);
         wayString = data.name;
         way = data.id;
         bot.editMessageText(`Едем ${wayString.toLowerCase()}`, helpers.getEditParams(msg));
         return helpers.generateOptions(transportId, bus, wayString);
      })
      .then(options => bot.sendMessage(chatId, 'Выбери остановку', options))
      .then(() => helpers.getOnceEventPromise(bot, 'callback_query'))
      .then(msg => {
         station = msg.data;
         return helpers.prepareText([bus, way, station], msg.message, transportId);
      })
      .then(text => {
         bot.sendMessage(chatId, text);
         return helpers.getStationNameByValue(transportId, bus, wayString, station);
      })
      .then(name => bot.editMessageText(`Едем с остановки: ${name}`, helpers.getEditParams(msg)));
});