const
    TelegramBot = require('node-telegram-bot-api'),
    bus = require('./bus.json'),
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

function prepareText(link) {
    let
        xhr = new XMLHttpRequests(),
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

function createLink(bus, way, station) {
   return 'http://yartr.ru/rasp.php?vt=1&nmar='+ bus +'&q='+ way + '&id=' + station + '&view=1';
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Hello! Commands: /gohome - bus on station "Hospital", /gowork bus on station "Prospect Tolbuhina"');
});

bot.onText(/\/gohome/, (msg) => {
    bot.sendMessage(msg.chat.id, msg.chat.first_name + ', ' + prepareText(createLink(78, 0, 424)));
});

bot.onText(/\/gowork/, (msg) => {
    bot.sendMessage(msg.chat.id, msg.chat.first_name + ', ' + prepareText(createLink(78, 0, 47)));
});

bot.onText(/\/test (.+) (.+)/, (msg, match) => {
    bot.sendMessage(msg.chat.id, msg.chat.first_name + ', ' + prepareText(bus['78'][match[1]][match[2]]));
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id,
        'Направления: центр, брагино \n' +
        'Остановки: ' + bus['const']['stations']);
});