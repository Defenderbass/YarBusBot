const
   busMin = require('./bus.min.json'),
   Entities = require('html-entities').XmlEntities,
   XMLHttpRequests = require('xmlhttprequest').XMLHttpRequest,
   entities = new Entities();

module.exports = {
   /**
    * Create link to the 'yartr.ru' on different bus and station
    * @param {Array} arr
    * @param {Number} vt
    * @returns {string}
    */
   createLink: function (arr, vt) {
      return `http://yartr.ru/rasp.php?vt=${vt}&nmar=${arr[0]}&q=${arr[1]}&id=${arr[2]}&view=1`;
   },

   /**
    * Return response text of SitePage
    * @param {string} link
    * @returns {*|string}
    */
   getResponseText: function (link) {
      let
         xhr = new XMLHttpRequests();
      xhr.open('GET', link, false);
      xhr.send();

      return xhr.responseText;
   },

   /**
    * Prepares the text for the output
    * @param {Array} arr
    * @param {object} msg
    * @param {object} msg.chat
    * @returns {string}
    */
   prepareText: function (arr, msg, vt) {
      let
         link = this.createLink(arr, vt),
         original, position, pos;

      original = entities.decode(this.getResponseText(link)).replace(/<[^>]+>/g, ' ');
      position = original.indexOf('Табло');
      pos = original.indexOf('назад', position + 2);
      if (pos + 1) {
         original = original.substring(position, pos);
      } else {
         original = original.substring(position, original.length);
      }
      original = original.replace(/назад/g, '').replace(/Табло/g, '').replace(/Ав/g, '\n Ав').replace(/Тб/g, '\n Тр')
         .replace(/Тм/g, '\n Тм');
      return `${msg.chat.first_name},${original}`;
   },

   /**
    * Return options for Inline Keyboard
    * @param {string=} bus
    * @param {string=} way
    * @returns {{reply_markup}}
    */
   generateOptions: function (transport, bus, way) {
      let
         obj, arr,
         result = [],
         data, opt;
      if (transport) {
         if (bus) {
            if (way) {
               obj = this.porno(transport, bus)[way];
            } else {
               obj = this.porno(transport, bus);
            }
         } else {
            obj = busMin[transport];
         }
      } else {
         obj = busMin;
      }
      arr = Object.keys(obj);
      for (let value of arr) {
         data = way ? obj[value] : value;
         if (transport && bus && !way) {
            data = JSON.stringify({
               id: arr.indexOf(value),
               name: value
            });
         }
         opt = {text: value, callback_data: data};
         if (arr.indexOf(value) % 2) {
            result[result.length - 1].push(opt);
         } else {
            result.push([opt]);
         }
      }

      return {
         reply_markup: JSON.stringify({
            inline_keyboard: result
         })
      };
   },

   /**
    * Return params for edit message
    * @param {object} msg
    * @returns {{message_id: (*|Number|String), chat_id: string}}
    */
   getEditParams: function (msg) {
      return {
         message_id: msg.message.message_id,
         chat_id: msg.message.chat.id
      };
   },

   /**
    * Return name of station
    * @param {string} bus
    * @param {string} way
    * @param {string} station
    * @returns {string}
    */
   getStationNameByValue: function (transport, bus, way, station) {
      let
         obj = this.porno(transport, bus)[way];
      if (obj) {
         for (let value of Object.keys(obj)) {
            if (obj[value] === station) {
               return value;
            }
         }
      }
   },

   porno: function (vt, number) {
      let
         arr = [], firstArr = [], secondArr = [], repBr, newVal,
         str = entities.decode(this.getResponseText(`http://yartr.ru/config.php?vt=${vt}&nmar=${number}`));
      str = str.slice(str.indexOf('<body>'), str.indexOf('</body>'));
      repBr = (str) => {
         str = str.replace(/<br\/>/g, '').replace(/<body>/g, '').replace(/<\/body>/g, '').replace(/<\/a>/g, '').replace(/Направление:/g, '')
            .replace(new RegExp(`<a href='rasp.php\\?vt=${vt}&nmar=${number}&q=0&id=`, 'g'), '').replace(new RegExp(`<a href='rasp.php\\?vt=${vt}&nmar=${number}&q=1&id=`, 'g'), '')
            .replace(new RegExp(`<a href='list.php\\?vt=${vt}'>назад`, 'g'), '').replace(/&view=1'>/g, ':');
         str.split('  ').map((val) => {
            if (val.replace(/"/g, '')) {
               arr.push('"' + val.trim() + '"');
            }
         });
         arr.pop();
         let pos = 0;
         arr.map((val) => {
            if (val.match(/От /) && arr.indexOf(val)) {
               pos = arr.indexOf(val);
            }
            pos ? secondArr.push(prepareElem(val)) : firstArr.push(prepareElem(val));
         });
         return JSON.parse(`\{${ finalReplace(firstArr)}\}\, \n ${finalReplace(secondArr)}\}\}`);
      };
      let prepareElem = (val) => {
         newVal = [];
         val.split(':').reverse().map((str) => {
            newVal.push('"' + str + '"');
         });
         return newVal.toString().replace(/,/g, ':');
      };
      let finalReplace = (arr) => {
         return arr.toString().replace(/,/, ':{').replace(/\"\:\"/g, ':').replace(/\"\"/g, '"').replace(/\" \"/g, '"');
      };
      return repBr(str);
   }
};