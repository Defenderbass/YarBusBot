const
   busMin = require('./bus.min.json'),
   Entities = require('html-entities').XmlEntities,
   XMLHttpRequests = require('xmlhttprequest').XMLHttpRequest,
   entities = new Entities();

module.exports = {
   /**
    * Create link to the 'yartr.ru' on different bus and station
    * @param {string} str
    * @returns {string}
    */
   createLink: function (str) {
      let
         array = str.split(' ');

      return 'http://yartr.ru/rasp.php?vt=1&nmar=' + array[0] + '&q=' + array[1] + '&id=' + array[2] + '&view=1';
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
    * @param {string} str
    * @param {object} msg
    * @param {object} msg.chat
    * @returns {string}
    */
   prepareText: function (str, msg) {
      let
         link = this.createLink(str),
         original, position, pos;

      original = entities.decode(this.getResponseText(link)).replace(/<[^>]+>/g, ' ');
      position = original.indexOf('Табло');
      pos = original.indexOf('назад', position + 2);
      if (pos + 1) {
         original = original.substring(position, pos);
      } else {
         original = original.substring(position, original.length);
      }
      original = original.replace(/назад/g, '').replace(/Табло/g, '').replace(/Ав/g, '\n Ав').replace(/Тб/g, '\n Тб');
      return msg.chat.first_name + ',\n' + original;
   },

   /**
    * Return number instead name of way
    * @param {string} bus
    * @param {string} way
    * @returns {number}
    */
   getNumberOfWay: function (bus, way) {
      let
         obj = busMin[bus],
         arr = Object.keys(obj);

      return arr.indexOf(way);
   },

   /**
    * Return options for Inline Keyboard
    * @param {string=} bus
    * @param {string=} way
    * @returns {{reply_markup}}
    */
   generateOptions: function (bus, way) {
      let
         obj, arr,
         result = [],
         data;

      if (bus) {
         if (way) {
            obj = busMin[bus][way];
         } else {
            obj = busMin[bus];
         }
      } else {
         obj = busMin;
      }
      arr = Object.keys(obj);
      for (let i = 0; i < arr.length; i++) {
         data = way + 1 ? obj[arr[i]] : arr[i];
         result.push([{text: arr[i], callback_data: data}]);
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
      }
   }
};