const
   TelegramBot = require('node-telegram-bot-api'),
   token = '370885878:AAHNT9nRTHMd6MJ8dQvRbzw9GFpzomt719s',
   port = process.env.PORT || 8443,
   host = process.env.HOST,
   bot = new TelegramBot(token, {
      polling: true, webhook: {
       'port': port,
       'host': host
       }
   }),
   helpers = require('./helpers.js'),
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
      bus, way, station, chatId, wayString, transport, transportId,
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
               options = helpers.generateOptions(transport, bus);
               bot.sendMessage(chatId, 'Выбери направление', options).then(() => {
                  bot.once('callback_query', (msg) => {
                     wayString = msg.data;
                     way = helpers.getNumberOfWay(transport, bus, msg.data);
                     bot.editMessageText(`Едем ${msg.data.toLowerCase()}`, helpers.getEditParams(msg));
                     options = helpers.generateOptions(transport, bus, wayString);
                     bot.sendMessage(chatId, 'Выбери остановку', options).then(() => {
                        bot.once('callback_query', (msg) => {
                           station = msg.data;
                           bot.sendMessage(chatId, helpers.prepareText([bus, way, station], msg.message, transportId));
                           bot.editMessageText(`Едем с остановки: ${helpers.getStationNameByValue(transport, bus, wayString, station)}`,
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