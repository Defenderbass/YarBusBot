import {XmlEntities as Entities} from 'html-entities';
import fetch from 'node-fetch';
import Memoize from "./Memoize";

const entities = new Entities();

class Helper {
   /**
    * Create link to the 'yartr.ru' on different bus and station
    * @param {Array} arr
    * @param {Number} vt
    * @returns {string}
    */
   createLink(arr, vt) {
      return `http://yartr.ru/rasp.php?vt=${vt}&nmar=${arr[0]}&q=${arr[1]}&id=${arr[2]}&view=1`;
   }

   /**
    * Return response text of SitePage
    * @param {string} link
    * @returns {*|string}
    */
   getResponseText = (link) => fetch(link).then(response => response.text());

   /**
    * Prepares the text for the output
    * @param {Array} arr
    * @param {object} msg
    * @param {object} msg.chat
    * @returns {Promise}
    */
   prepareText(arr, msg, vt) {
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
               original = original.replace(/назад/g, '').replace(/Табло/g, '').replace(/Ав/g, '\n Ав')
                  .replace(/Тб/g, '\n Тр').replace(/Тм/g, '\n Тм');
               resolve(`${msg.chat.first_name},${original}`);
            })
            .catch(error => reject(error));
      });

   }

   /**
    * Return options for Inline Keyboard
    * @param {string=} bus
    * @param {string=} way
    * @returns {Promise}
    */
   @Memoize
   generateOptions(transport, bus, way) {
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

   }

   /**
    * Return params for edit message
    * @param {object} msg
    * @returns {{message_id: (*|Number|String), chat_id: string}}
    */
   getEditParams = (msg) => ({
      message_id: msg.message.message_id,
      chat_id: msg.message.chat.id
   });

   /**
    * Return name of station
    * @param {string} bus
    * @param {string} way
    * @param {string} station
    * @returns {Promise}
    */
   getStationNameByValue(transport, bus, way, station) {

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

   }

   porno(vt, number) {
      let
         arr = [], firstArr = [], secondArr = [], repBr, newVal,
         finalReplace, prepareElem, str;

      return new Promise((resolve, reject) => {
         this.getResponseText(`http://yartr.ru/config.php?vt=${vt}&nmar=${number}`)
            .then(text => {
               str = entities.decode(text);
               prepareElem = (val) => {
                  newVal = [];
                  val.split(':').reverse().map((str) => {
                     newVal.push('"' + str + '"');
                  });
                  return newVal.toString().replace(/,/g, ':');
               };
               finalReplace = (arr) => {
                  return arr.toString().replace(/,/, ':{').replace(/\"\:\"/g, ':').replace(/\"\"/g, '"')
                     .replace(/\" \"/g, '"').replace(/�/g, '');
               };
               str = str.slice(str.indexOf('<body>'), str.indexOf('</body>'));
               repBr = (str) => {
                  str = str.replace(/<br\/>/g, '').replace(/<body>/g, '').replace(/<\/body>/g, '').replace(/<\/a>/g, '')
                     .replace(/Направление:/g, '').replace(new RegExp(`<a href='list.php\\?vt=${vt}'>назад`, 'g'), '')
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


   }

   pornoList = (vt) =>
      new Promise((resolve, reject) => {
         this.getResponseText(`http://yartr.ru/list.php?vt=${vt}`)
            .then(text => {
               let str = entities.decode(text);
               str = str.slice(str.indexOf('<body>'), str.indexOf('</body>'));
               let res = [];
               str.match(/nmar=\d+[a-z]?/g).map(function(val) {
                  val = '"' + val.replace('nmar=', '') + '"';
                  val = val + ':' + val;
                  res.push(val);
               });
               resolve(JSON.parse('{' + res.toString() + '}'));
            })
            .catch(error => reject(error));
      });

   getOnceEventPromise = (bot, eventName) =>
      new Promise((resolve, reject) => {
         bot.once(eventName, msg => resolve(msg));
      });
}

export default new Helper();