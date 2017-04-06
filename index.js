const
   TelegramBot = require('node-telegram-bot-api'),
   XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
   Entities = require('html-entities').XmlEntities,
   entities = new Entities(),
   token = '370885878:AAHNT9nRTHMd6MJ8dQvRbzw9GFpzomt719s',
   port = process.env.PORT || 8443,
   host = process.env.HOST,
   busToWork = 'http://yartr.ru/rasp.php?vt=1&nmar=78&q=0&id=47&view=1',
   busToHome = 'http://yartr.ru/rasp.php?vt=1&nmar=78&q=1&id=424&view=1',
   bot = new TelegramBot(token, {
   polling: true, webhook: {
      "port": port,
      "host": host
   }
});

function prepareText(link) {
   let
      xhr = new XMLHttpRequest(),
      original, position, pos;

   xhr.open('GET', link, false);
   xhr.send();
   original = entities.decode(xhr.responseText).replace(/<[^>]+>/g, ' ').replace(/назад/g, '');
   position = original.indexOf('Ав 78');
   pos = original.indexOf('Ав', position + 2);
   if (pos + 1) {
      original = original.substring(position, pos);
   } else {
      original = original.substring(position, original.length);
   }
   return original;
}

bot.onText(/\/start/, (msg) => {
   const chatId = msg.chat.id;
   bot.sendMessage(chatId, 'Hello! Commands: /gohome - bus on station "Hospital", /gowork bus on station "Prospect Tolbuhina"');
});

bot.onText(/\/gohome/, (msg) => {
   bot.sendMessage(msg.chat.id, msg.chat.first_name + ', ' + prepareText(busToHome));
});

bot.onText(/\/gowork/, (msg) => {
   bot.sendMessage(msg.chat.id, msg.chat.first_name + ', ' + prepareText(busToWork));
});