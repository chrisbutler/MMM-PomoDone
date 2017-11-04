var NodeHelper = require("node_helper");
var request = require('request');
var moment = require('moment');

module.exports = NodeHelper.create({
  start: function() {
    console.log("@xxxxxx[{::::::::::::::::::::::::::::::::::> Starting node_helper for [" + this.name + "]");
  },
  socketNotificationReceived: function(notification, payload){
    if (notification === 'POMODONE_STATUS_GET') {
      this.getTimeStatus(payload);
    }
  },
	getTimeStatus: function(payload) {
		var self = this;
    var returned = 0;
    var status = {};

		request({ url: payload.url, method: 'GET' }, function(error, response, body) {
      if(!error && response.statusCode == 200){
        var data = JSON.parse(body);

        if (data.error) {
          console.log("MMM-PomoDone error: ", data.error);
          status.error = true;
        } else {
          console.log("MMM-PomoDone status data: ", data);
          status = data;
        }
      } else {
        console.log( "Error getting PomoDone timer status: ", response);
        status.error = true;
      }

      if (!status.error) {
        self.sendSocketNotification('POMODONE_STATUS_RESPONSE' + payload.instanceId, status);
      };
    });
	}
});
