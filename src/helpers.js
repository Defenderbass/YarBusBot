const
   Entities = require('html-entities').XmlEntities,
   entities = new Entities(),
   fetch = require('node-fetch');

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
      return fetch(link)
         .then(response => response.text());
   },

   /**
    * Prepares the text for the output
    * @param {Array} arr
    * @param {object} msg
    * @param {object} msg.chat
    * @returns {Promise}
    */
   prepareText: function (arr, msg, vt) {
      let
         link = this.createLink(arr, vt),
         original, position, pos;


      return new Promise((resolve, reject) => {
         this.getResponseText(link)
            .then(text => {
               original = entities.decode(text).replace(/<[^>]+>/g, ' ');
               position = original.indexOf('Табло');
               pos = original.indexOf('назад', position + 2);
               if (pos + 1) {
                  original = original.substring(position, pos);
               } else {
                  original = original.substring(position, original.length);
               }
               original = original.replace(/назад|Табло/g, '').replace(/Ав|Тм|Тб/g, '\n $&');
               resolve(`${msg.chat.first_name},${original}`);
            })
            .catch(error => reject(error));
      });

   },

   /**
    * Return options for Inline Keyboard
    * @param {string=} bus
    * @param {string=} way
    * @returns {Promise}
    */
   generateOptions: function (transport, bus, way) {
      let arr, result = [], data, opt, objPromise;
      if (transport) {
         if (bus) {
            if (way) {
               objPromise = this.porno(transport, bus).then(result => result[way]);
            } else {
               objPromise = this.porno(transport, bus);
            }
         } else {
            objPromise = this.pornoList(transport);
         }
      } else {
         objPromise = Promise.resolve({
            'Автобус': {},
            'Троллейбус': {},
            'Трамвай': {}
         });
      }

      return new Promise((resolve, reject) => {
         objPromise.then(obj => {
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
               if (arr.length > 30) {
                  if (arr.indexOf(value) % 4) {
                     result[result.length - 1].push(opt);
                  } else {
                     result.push([opt]);
                  }
               } else {
                  if (arr.indexOf(value) % 2) {
                     result[result.length - 1].push(opt);
                  } else {
                     result.push([opt]);
                  }
               }
            }

            resolve({
               reply_markup: JSON.stringify({
                  inline_keyboard: result
               })
            });
         }).catch(error => reject(error));
      });

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
    * @returns {Promise}
    */
   getStationNameByValue: function (transport, bus, way, station) {

      return new Promise((resolve, reject) => {
         this.porno(transport, bus).then(result => {
            let obj = result[way];
            if (obj) {
               for (let value of Object.keys(obj)) {
                  if (obj[value] === station) {
                     return value;
                  }
               }
            }
         }).then(result => resolve(result))
            .catch(error => reject(error));
      });

   },

   porno: function (vt, number) {
      let
         removeRegExp = /<br\/>|<body>|<\/body>|<\/a>|Направление:/g,
         arr = [], firstArr = [], secondArr = [], repBr, newVal,
         finalReplace, prepareElem, str;

      return new Promise((resolve, reject) => {
         this.getResponseText(`http://yartr.ru/config.php?vt=${vt}&nmar=${number}`)
            .then(text => {
               str = entities.decode(text);
               prepareElem = (val) => {
                  newVal = [];
                  val.split(':').reverse().map((str) => {
                     if (str.length > 25) {
                        str = str.toString().substr(0, 25) + '"';
                     }

                     newVal.push('"' + str + '"');
                  });
                  return newVal.toString().replace(/,/g, ':');
               };
               finalReplace = (arr) => {
                  return arr.toString().replace(/,/, ':{').replace(/\"\:\"/g, ':').replace(/\"\"|\" \"/g, '"').replace(/�/g, '');
               };
               str = str.slice(str.indexOf('<body>'), str.indexOf('</body>'));
               repBr = (str) => {
                  str = str.replace(removeRegExp, '')
                     .replace(new RegExp(`<a href='list.php\\?vt=${vt}'>назад`, 'g'), '')
                     .replace(new RegExp(`<a href='rasp.php\\?vt=${vt}&nmar=${number}&q=0&id=`, 'g'), '')
                     .replace(new RegExp(`<a href='rasp.php\\?vt=${vt}&nmar=${number}&q=1&id=`, 'g'), '')
                     .replace(/&view=1'>/g, ':');
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
               resolve(repBr(str));
            })
            .catch(error => reject(error));
      });


   },

   getStation: function (myPosition = [57.63189, 39.83377], transport = 1, bus = 78, way, prev = []) {
      return new Promise((resolve, reject) => {
         this.getResponseText(`http://www.ot76.ru/getpe.php?vt=${transport}&r=[%22${bus}%22]`)
            .then(text => {
                  let
                     temp = 0,
                     stationArray = JSON.parse(text),
                     tr = [];

                  /*
                  * Надо убрать лишние автобусы которые едут в обратном направлении
                  * Убрать по way
                  * */

                  stationArray.forEach(function (arr) {
                     if (!(arr[1] === prev[0] && arr[2] === prev[1])) {
                        tr.push(Math.sqrt(Math.pow((arr[1] - myPosition[0]), 2) + Math.pow((arr[2] - myPosition[1]), 2)));
                     }
                  });

                  tr.forEach(function (coord) {
                     if (!temp || (coord < temp)) {
                        temp = coord
                     }
                  });
                  resolve({
                     text: 'Ближайший к вам : ' + bus,
                     location: [stationArray[tr.indexOf(temp)][2], stationArray[tr.indexOf(temp)][1]]
                  });
               }
            );
      });

   },

   pornoList: function (vt) {
      return new Promise((resolve, reject) => {
         this.getResponseText(`http://yartr.ru/list.php?vt=${vt}`)
            .then(text => {
               let str = entities.decode(text);
               str = str.slice(str.indexOf('<body>'), str.indexOf('</body>'));
               let res = [];
               str.match(/nmar=\d+[a-z]?/g).map(function (val) {
                  val = '"' + val.replace('nmar=', '') + '"';
                  val = val + ':' + val;
                  res.push(val);
               });
               resolve(JSON.parse('{' + res.toString() + '}'));
            })
            .catch(error => reject(error));
      });
   },

   getOnceEventPromise(bot, eventName) {
      return new Promise((resolve, reject) => {
         bot.once(eventName, msg => resolve(msg));
      });
   }
};