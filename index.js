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
   bot.sendMessage(msg.chat.id, helpers.prepareText([78, 1, 424], msg));
});

bot.onText(/\/gowork/, (msg) => {
   bot.sendMessage(msg.chat.id, helpers.prepareText([78, 0, 47], msg));
});

bot.onText(/\/bus/, (msg) => {
   let
      bus, way, station, chatId,
      options = helpers.generateOptions();

   bot.sendMessage(msg.chat.id, 'Выбери автобус', options).then(() => {
      bot.once('callback_query', (msg) => {
         bus = msg.data;
         chatId = msg.message.chat.id;
         bot.editMessageText(`Выбран ${bus} автобус`, helpers.getEditParams(msg));
         options = helpers.generateOptions(bus);
         bot.sendMessage(chatId, 'Выбери направление', options).then(() => {
            bot.once('callback_query', (msg) => {
               way = helpers.getNumberOfWay(bus, msg.data);
               bot.editMessageText(`Едем ${msg.data.toLowerCase()}`, helpers.getEditParams(msg));
               options = helpers.generateOptions(bus, msg.data);
               bot.sendMessage(chatId, 'Выбери остановку', options).then(() => {
                  bot.once('callback_query', (msg) => {
                     station = msg.data;
                     bot.sendMessage(chatId, helpers.prepareText([bus, way, station], msg.message));
                     bot.editMessageText(`Едем с остановки: $(helpers.getStationNameByValue(bus, way, station))`,
                        helpers.getEditParams(msg));
                  });
               });
            });
         });
      });
   });
});