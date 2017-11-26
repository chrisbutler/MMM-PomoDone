// Magic Mirror Module: MMM-PomoDone
// By Chris Butler

Module.register('MMM-PomoDone', {
  defaults: {
    url: 'https://pomodone-magicmirror.glitch.me/timer/status',
    pollFrequency: 1000 * 10
  },
  getStyles: function() {
    return ['MMM-PomoDone.css', 'MMM-TimeTimer.css'];
  },
  getScripts: function() {
    return ["moment.js", this.file("node_modules/moment-duration-format/lib/moment-duration-format.js"), this.file("node_modules/countdown/countdown.js"), this.file("node_modules/moment-countdown/dist/moment-countdown.min.js")];
  },
  start: function() {
    Log.info(`Starting ${this.name}`);

    this.loading = false;
    this.isHidden = false;

    this.response = {};
    this.timer = () => ({});

    this.ticker = '';
    this.task = '';

    this.getData();

    console.log('module start', this);
  },
  getData: function() {
    console.log('getData', this.response);
    if (this.config.url) {
      this.sendSocketNotification("POMODONE_STATUS_GET", {
        url: this.config.url,
        instanceId: this.identifier
      });
    } else {
      this.hide(1000, {lockString: this.identifier});
      this.isHidden = true;
    }
  },
  socketNotificationReceived: function(notification, payload) {
    if (notification === 'POMODONE_STATUS_RESPONSE' + this.identifier) {
      console.log('*** MMM-PomoDone responseReceived', payload);
      this.response = payload;

      if (this.response.task) {
        this.task = this.response.task;
      }

      if (this.response.minutes) {
        const end = moment(this.response.start).add(this.response.minutes, 'minutes');
        this.timer = () => {
          return moment.duration(end.diff(moment()));
        }

        console.log('building timer', this.ticker, this.response);

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
      } else if (this.response.stop) {
        this.timer = () => ({});
        this.hide(0, {lockString: this.identifier});
        this.isHidden = true;
      }
    }
  },
  getDom: function() {
    console.log('getDom');
    var wrapper = document.createElement("div");

    if (this.loading) {
      var loading = document.createElement("div");

      loading.innerHTML = this.translate("LOADING");
      loading.className = "bright light small";

      wrapper.appendChild(loading);
    }

    if (this.response.stop) {
      console.log('timer stopped');
      clearInterval(this.ticker);
      this.ticker = '';

      var loading = document.createElement("div");

      loading.innerHTML = this.translate("FINISHED!");
      loading.className = "bright light small";

      wrapper.appendChild(loading);
    }

    if (this.timer().minutes) {
      if (!this.ticker) {
        this.ticker = setInterval(() => {
          if (!this.timer) {
            clearInterval(this.ticker);
            this.ticker = '';
          }
          this.updateDom();
        }, 1000);
      }

      var row = document.createElement("div");
      row.classList.add("MMM-PomoDone");

      var heading = document.createElement("div");
      heading.className = "task-name dimmed";
      heading.innerHTML = this.task;

      var summary = document.createElement("div");
      summary.classList.add("timer");

      const timeRemaining = moment.duration({
        minutes: this.timer()['minutes']() + 1,
        seconds: this.timer()['seconds']()
      });

      const secondsRemaining = timeRemaining.asSeconds();

      var timeTimer = document.createElement("div");
      timeTimer.classList.add("time-timer");

      var ticks = document.createElement('span');
      ticks.classList.add('ticks');

      timeTimer.innerHTML = `
        <svg style="stroke-dasharray: ${ 360 - (secondsRemaining % 360)}% 360%"
          class="ticker" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="m50 1.5c-26.5 0-48 22-48 48.5 0 26.5 21.5 48 48 48.5 26.5 0 48-22 48.5-48.5-.5-26.5-21.5-48.5-48-48.5h-.5" fill="none" stroke="#eee"></path>
        </svg>`;

      for (var i = 1; i <= 60; i++) {
        let tick = document.createElement('span');
        tick.classList.add(`tick-${i}`);
        ticks.appendChild(tick);
      }

      timeTimer.appendChild(ticks);

      console.log('clock', timeTimer);

      row.appendChild(timeTimer);

      if (this.timer().minutes)
        console.log('getDom timer', this.timer().minutes(), this.timer().seconds(), secondsRemaining);

      summary.innerHTML = timeRemaining.format('m:', {trim: 'left'});

      var seconds = document.createElement('span');
      seconds.classList.add('seconds')
      seconds.innerHTML = timeRemaining.format('m:ss').replace(/^(.*):/, '');

      summary.appendChild(seconds);

      row.appendChild(heading);
      row.appendChild(summary);

      wrapper.appendChild(row);
    }

    return wrapper;
  },

  notificationReceived: function(notification, payload, sender) {
    if (notification == 'DOM_OBJECTS_CREATED') {
      this.hide(0, {lockString: this.identifier});
      this.isHidden = true;
    }
  }
});
