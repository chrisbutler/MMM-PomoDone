var NodeHelper = require("node_helper");
var request = require('request');
var moment = require('moment');
var WebSocket = require('ws');

function WebSocketClient() {
  this.number = 0; // Message number
  this.autoReconnectInterval = 5 * 1000; // ms
}
WebSocketClient.prototype.open = function(url) {
  this.url = url;
  this.instance = new WebSocket(this.url);
  this.instance.on('open', () => {
    this.onopen();
  });
  this.instance.on('message', (data, flags) => {
    this.number++;
    this.onmessage(data, flags, this.number);
  });
  this.instance.on('close', (e) => {
    switch (e) {
      case 1000: // CLOSE_NORMAL
        console.log("WebSocket: closed");
        break;
      default: // Abnormal closure
        this.reconnect(e);
        break;
    }
    this.onclose(e);
  });
  this.instance.on('error', (e) => {
    switch (e.code) {
      case 'ECONNREFUSED':
        this.reconnect(e);
        break;
      default:
        this.onerror(e);
        break;
    }
  });
}
WebSocketClient.prototype.send = function(data, option) {
  try {
    this.instance.send(data, option);
  } catch (e) {
    this.instance.emit('error', e);
  }
}
WebSocketClient.prototype.reconnect = function(e) {
  console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e);
  this.instance.removeAllListeners();
  var that = this;
  setTimeout(function() {
    console.log("WebSocketClient: reconnecting...");
    that.open(that.url);
  }, this.autoReconnectInterval);
}
WebSocketClient.prototype.onopen = function(e) {
  console.log("WebSocketClient: open", arguments);
}
WebSocketClient.prototype.onmessage = function(data, flags, number) {
  console.log("WebSocketClient: message", arguments);
}
WebSocketClient.prototype.onerror = function(e) {
  console.log("WebSocketClient: error", arguments);
}
WebSocketClient.prototype.onclose = function(e) {
  console.log("WebSocketClient: closed", arguments);
}

module.exports = NodeHelper.create({
  start: function() {
    console.log("@xxxxxx[{::::::::::::::::::::::::::::::::::> Starting node_helper for [" + this.name + "]");
  },
  socketNotificationReceived: function(notification, payload) {
    if (notification === 'POMODONE_STATUS_GET') {
      this.getTimeStatus(payload);
    }
  },
  getTimeStatus: function(payload) {
    var that = this;
    var returned = 0;
    var status = {};

    var wsc = new WebSocketClient();
    wsc.open('ws://pomodone-magicmirror.glitch.me/timer/status');

		wsc.onopen = function(e) {
      console.log('WebSocketClient connected:', e);
      this.send('connected');
    }

		wsc.onmessage = function(msg, flags, number) {
      console.log(`WebSocketClient message #${number}: `, msg, flags);
      var data = JSON.parse(msg);
      that.sendSocketNotification('POMODONE_STATUS_RESPONSE' + payload.instanceId, data);
      // socket.send(`data received by MagicMirror ${msg}`);
    }
  }
});
