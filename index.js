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
   helpers = require('./helpers.js');

bot.onText(/\/start/, (msg) => {
   bot.sendMessage(msg.chat.id, 'Hello! Commands: /gohome - bus on station "Hospital", /gowork bus on station "Prospect Tolbuhina"');
});

bot.onText(/\/gohome/, (msg) => {
   bot.sendMessage(msg.chat.id, helpers.prepareText('1 424', msg));
});

bot.onText(/\/gowork/, (msg) => {
   bot.sendMessage(msg.chat.id, helpers.prepareText('0 47', msg));
});

bot.onText(/\/bus/, (msg) => {
   let
      bus, way, station, chatId,
      options = {
         reply_markup: JSON.stringify({
            inline_keyboard: [
               [{text: '78', callback_data: '78'}]
            ]
         })
      };

   bot.sendMessage(msg.chat.id, 'Выбери автобус', options).then(function() {
      bot.once('callback_query', function(msg) {
         bus = msg.data;
         chatId = msg.message.chat.id;
         bot.editMessageText('Выбран ' + bus + ' автобус', {
            message_id: msg.message.message_id,
            chat_id: chatId
         });
         options = {
            reply_markup: JSON.stringify({
               inline_keyboard: helpers.generateOptions(bus)
            })
         };
         bot.sendMessage(chatId, 'Выбери направление', options).then(function() {
            bot.once('callback_query', function(msg) {
               way = helpers.getNumberOfWay(bus, msg.data);
               bot.editMessageText('Направление выбрано', {
                  message_id: msg.message.message_id,
                  chat_id: chatId
               });
               options = {
                  reply_markup: JSON.stringify({
                     inline_keyboard: helpers.generateOptions(bus, msg.data)
                  })
               };
               bot.sendMessage(chatId, 'Выбери остановку', options).then(function() {
                  bot.once('callback_query', function(msg) {
                     station = msg.data;
                     bot.sendMessage(chatId, helpers.prepareText((way + ' ' + station), msg.message));
                     bot.editMessageText('Остановка выбрана', {
                        message_id: msg.message.message_id,
                        chat_id: chatId
                     });
                  });
               });
            });
         });
      });
   });
});