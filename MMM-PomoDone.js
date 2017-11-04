// Magic Mirror Module: MMM-PomoDone
// By Chris Butler

Module.register('MMM-PomoDone', {
  defaults: {
    url: 'https://pomodone-magicmirror.glitch.me/timer/status',
    pollFrequency: 1000 * 1,
  },
  getStyles: function () {
    return ["MMM-PomoDone.css"];
  },
  start: function() {
    Log.info(`Starting ${this.name}`);

    this.status = {};
    this.loading = false;
    this.isHidden = false;

    setInterval(() => {
      this.getData();
    }, this.config.pollFrequency);
  },
  getData: function() {
    console.log('getData', this);
    if (this.config.url) {
      this.sendSocketNotification("POMODONE_STATUS_GET", {url: this.config.url, instanceId: this.identifier});
    } else {
      this.hide(1000, {lockString: this.identifier});
      this.isHidden = true;
    }
  },
  getDom: function() {
    console.log('getDom', this.status);
    var wrapper = document.createElement("div");

    if (this.loading) {
      var loading = document.createElement("div");
        loading.innerHTML = this.translate("LOADING");
        loading.className = "dimmed light small";
        wrapper.appendChild(loading);
      return wrapper
    }

    var row = document.createElement("div");
    row.classList.add("row");

    var heading = document.createElement("span");
    heading.className = "destination-label bright";
    heading.innerHTML = `${this.status.minutes}:${this.status.seconds}`;

    var summary = document.createElement("div");
    summary.classList.add("route-summary");
    summary.innerHTML = 'testing test';

    row.appendChild(heading);
    row.appendChild(summary);
    wrapper.appendChild(row);

    return wrapper;
  },
  socketNotificationReceived: function(notification, payload) {
    if (notification === 'POMODONE_STATUS_RESPONSE' + this.identifier) {
      console.log('responseReceived', payload);
      this.status = payload;
      if (this.loading) {
        this.loading = false;
        if (this.isHidden) {
          this.updateDom();
          this.show(1000, {lockString: this.identifier});
        } else {
          this.updateDom(1000);
        }
      } else {
        this.updateDom();
        this.show(1000, {lockString: this.identifier});
      }
      this.isHidden = false;
    }
  },
  notificationReceived: function(notification, payload, sender) {
    if (notification == 'DOM_OBJECTS_CREATED') {
      this.hide(0, {lockString: this.identifier});
      this.isHidden = true;
    }
  }
});
