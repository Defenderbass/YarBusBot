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

   return 'http://yartr.ru/rasp.php?vt=1&nmar='+ 78 +'&q='+ array[0] + '&id=' + array[1] + '&view=1';
}

function prepareText(str) {
    let
       xhr = new XMLHttpRequests(),
       link= createLink(str),
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
    bot.sendMessage(msg.chat.id, 'Hello! Commands: /gohome - bus on station "Hospital", /gowork bus on station "Prospect Tolbuhina"');
});

bot.onText(/\/gohome/, (msg) => {
    bot.sendMessage(msg.chat.id, msg.chat.first_name + ', ' + prepareText('1 424'));
});

bot.onText(/\/gowork/, (msg) => {
    bot.sendMessage(msg.chat.id, msg.chat.first_name + ', ' + prepareText('0 47'));
});

bot.onText(/\/test (.+) (.+)/, (msg, match) => {
    bot.sendMessage(msg.chat.id, msg.chat.first_name + ', ' + prepareText(busMin['78'][match[1]][match[2]]));
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id,
        'Направления: центр, брагино \n' +
        'Остановки: ' + bus['const']['stations']);
});