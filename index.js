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
   bot.sendMessage(msg.chat.id, helpers.prepareText([78, 1, 424], msg, 1));
});

bot.onText(/\/gowork/, (msg) => {
   bot.sendMessage(msg.chat.id, helpers.prepareText([78, 0, 47], msg, 1));
});

bot.onText(/\/bus/, (msg) => {
   let
      bus, way, station, chatId, wayString, transport, transportId, data,
      options = helpers.generateOptions();

   bot.sendMessage(msg.chat.id, 'Выбери транспорт', options).then(() => {
      bot.once('callback_query', (msg) => {
         transport = msg.data;
         chatId = msg.message.chat.id;
         transportId = transport === 'Автобус' ? 1 : 3;
         bot.editMessageText(`Выбран ${transport}`, helpers.getEditParams(msg));
         options = helpers.generateOptions(transport);
         bot.sendMessage(chatId, 'Выбери номер', options).then(() => {
            bot.once('callback_query', (msg) => {
               bus = msg.data;
               bot.editMessageText(`Выбран №${bus}`, helpers.getEditParams(msg));
               options = helpers.generateOptions(transportId, bus);
               bot.sendMessage(chatId, 'Выбери направление', options).then(() => {
                  bot.once('callback_query', (msg) => {
                     data = JSON.parse(msg.data);
                     wayString = data.name;
                     way = data.id;
                     bot.editMessageText(`Едем ${wayString.toLowerCase()}`, helpers.getEditParams(msg));
                     options = helpers.generateOptions(transportId, bus, wayString);
                     bot.sendMessage(chatId, 'Выбери остановку', options).then(() => {
                        bot.once('callback_query', (msg) => {
                           station = msg.data;
                           bot.sendMessage(chatId, helpers.prepareText([bus, way, station], msg.message, transportId));
                           bot.editMessageText(`Едем с остановки: ${helpers.getStationNameByValue(transportId, bus, wayString, station)}`,
                              helpers.getEditParams(msg));
                        });
                     });
                  });
               });
            });
         });
      });
   });
});