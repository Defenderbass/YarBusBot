var TelegramBot = require('node-telegram-bot-api');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var Entities = require('html-entities').XmlEntities;
 
entities = new Entities();

    // ”станавливаем токен, который выдавал нам бот.
    var token = '370885878:AAHNT9nRTHMd6MJ8dQvRbzw9GFpzomt719s';
	var port = process.env.PORT || 8443;
	var host = process.env.HOST;
    // ¬ключить опрос сервера
    var bot = new TelegramBot(token, {polling: true, webhook: {
      "port": port,
      "host": host
    }});
	
	bot.onText(/\/start/, (msg, match) => {
		const chatId = msg.chat.id;
		bot.sendMessage(chatId, 'Hello! Commands: /gohome - bus on station "Hospital", /gowork bus on station "Prospect Tolbuhina"');
	});
	
	bot.onText(/\/gohome/, (msg, match) => {
		const chatId = msg.chat.id;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'http://yartr.ru/rasp.php?vt=1&nmar=78&q=1&id=424&view=1', false);
		xhr.send();
		var 
			original = entities.decode(xhr.responseText).replace(/<[^>]+>/g,' ');
			original = original.substring(40, original.length - 15);
		bot.sendMessage(chatId, msg.chat.first_name + ', ' + original);
	});

    bot.onText(/\/gowork/, (msg, match) => {
		const chatId = msg.chat.id;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'http://yartr.ru/rasp.php?vt=1&nmar=78&q=0&id=47&view=1', false);
		xhr.send();
		var 
			original = entities.decode(xhr.responseText).replace(/<[^>]+>/g,' ');
			original = original.replace(/назад/g, '');
			var position = original.indexOf('Ав 78');
			var pos = original.indexOf('Ав', position + 2);
			if (pos + 1) {
				original = original.substring(position, pos);
			} else {
				original = original.substring(position, original.lenght);
			}
		bot.sendMessage(chatId, msg.chat.first_name + ', ' + original);
});