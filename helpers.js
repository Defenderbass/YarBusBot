const
   busMin = require('./bus.min.json'),
   Entities = require('html-entities').XmlEntities,
   XMLHttpRequests = require('xmlhttprequest').XMLHttpRequest,
   entities = new Entities();

module.exports = {
   /**
    * Create link to the Yartr on deferent bus and station
    * @param str
    * @returns {string}
    */
   createLink: function(str) {
      let
         array = str.split(' ');

      return 'http://yartr.ru/rasp.php?vt=1&nmar=' + 78 + '&q=' + array[0] + '&id=' + array[1] + '&view=1';
   },

   /**
    * Return response text of SitePage
    * @param link
    * @returns {*|string}
    */
   getResponseText: function(link) {
      let
         xhr = new XMLHttpRequests();
      xhr.open('GET', link, false);
      xhr.send();

      return xhr.responseText;
   },

   /**
    * Prepares the text for the output
    * @param str
    * @param msg
    * @returns {string}
    */
   prepareText: function(str, msg) {
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
      original = original.replace(/назад/g, '').replace(/Табло/g, '').replace(/Ав/g, '\n Ав');
      return msg.chat.first_name + ',\n' + original;
   },

   /**
    * Return number instead name of way
    * @param bus
    * @param way
    * @returns {number}
    */
   getNumberOfWay: function(bus, way) {
      let
         obj = busMin[bus],
         arr = Object.keys(obj);

      return arr.indexOf(way);
   },

   /**
    * Return options for Inline Keyboard
    * @param bus
    * @param way
    * @returns {Array}
    */
   generateOptions: function(bus, way) {
      let
         obj = way + 1 ? busMin[bus][way] : busMin[bus],
         arr = Object.keys(obj),
         result = [],
         data;

      for (let i = 0; i < arr.length; i++) {
         data = way + 1 ? obj[arr[i]] : arr[i];
         result.push([{text: arr[i], callback_data: data}]);
      }

      return result;
   }
};