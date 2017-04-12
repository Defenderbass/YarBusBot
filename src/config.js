module.exports = {
   getToken: function(token) {
      return token ? token : '370885878:AAHNT9nRTHMd6MJ8dQvRbzw9GFpzomt719s';
   },

   getBotOptions: function(local) {
      let
         result = {polling: true},
         webhook = {
            port: process.env.PORT || 8443,
            host: process.env.HOST
         };

      if (!local) {
         result.webhook = webhook;
      }

      return result;
   }
};