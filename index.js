const
   TelegramBot = require('node-telegram-bot-api'),
   bus = require('./bus.json'),
   busMin = require('./bus.min.json'),
   XMLHttpRequests = require('xmlhttprequest').XMLHttpRequest,
   Entities = require('html-entities').XmlEntities,
   entities = new Entities(),
   token = '370885878:AAHNT9nRTHMd6MJ8dQvRbzw9GFpzomt719s',
   port = process.env.PORT || 8443,
   host = process.env.HOST,
   bot = new TelegramBot(token, {
      polling: true, webhook: {
         'port': port,
         'host': host
      }
   });

function createLink(str) {
   let
      array = str.split(' ');

   return 'http://yartr.ru/rasp.php?vt=1&nmar=' + 78 + '&q=' + array[0] + '&id=' + array[1] + '&view=1';
}

function getResponseText(link) {
   let
      xhr = new XMLHttpRequests();
   xhr.open('GET', link, false);
   xhr.send();

   return xhr.responseText;
}

function prepareText(str, msg) {
   let
      link = createLink(str),
      original, position, pos;

   original = entities.decode(getResponseText(link)).replace(/<[^>]+>/g, ' ');
   position = original.indexOf('Табло');
   pos = original.indexOf('назад', position + 2);
   if (pos + 1) {
      original = original.substring(position, pos);
   } else {
      original = original.substring(position, original.length);
   }
   original = original.replace(/назад || Табло/g, '');
   return msg.chat.first_name + ',\n' + original;
}

bot.onText(/\/start/, (msg) => {
   bot.sendMessage(msg.chat.id, 'Hello! Commands: /gohome - bus on station "Hospital", /gowork bus on station "Prospect Tolbuhina"');
});

bot.onText(/\/gohome/, (msg) => {
   bot.sendMessage(msg.chat.id, prepareText('1 424', msg));
});

bot.onText(/\/gowork/, (msg) => {
   bot.sendMessage(msg.chat.id, prepareText('0 47', msg));
});

bot.onText(/\/test (.+) (.+)/, (msg, match) => {
   bot.sendMessage(msg.chat.id, prepareText(busMin['78'][match[1]][match[2]], msg));
});

bot.onText(/\/help/, (msg) => {
   bot.sendMessage(msg.chat.id,
      'Направления: центр, брагино \n' +
      'Остановки: ' + bus['const']['stations']);
});