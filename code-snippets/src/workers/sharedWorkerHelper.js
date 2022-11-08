export default class SharedWorkerHelper {
  /*
  * Instantiate the Web Worker
  * Trigger an event message externally towards the worker script
  * Receive the message from the worker script and handle the event call
  * External listeners listen on that event and trigger their own callback
  */
  constructor() {
    if (window.SharedWorker) {
      this.worker = new SharedWorker('/workers/sharedWorker.js');
      this.events = {};
      this.worker.port.start();

      this.worker.port.addEventListener(
        'message',
        (e) => this.callEventCallback(e.data),
        false,
      );

      this.worker.port.addEventListener(
        'error',
        () => this.callEventCallback('error'),
        false,
      );
    }
  }

  trigger(eventName, data) {
    // Trigger an event message towards the worker script
    this.worker.port.postMessage({
      eventName,
      data,
    });
  }

  clearAllTimers() {
    // Clears all timers
    this.worker.port.postMessage({
      eventName: 'clearAllTimers',
    });
  }

  terminate() {
    // Terminates the worker thread with its events and timers
    this.clearAllTimers();
    this.worker.port.postMessage({
      type: 'cmd',
      action: 'die',
    });
  }

  on(eventName, callback) {
    // Record events and callbacks to listen on
    this.events[eventName] = callback;
  }

  callEventCallback({ event, data }) {
    // Call external callback based on event listened
    if (Object.prototype.hasOwnProperty.call(this.events, event)) {
      this.events[event].call(null, data);
    }
  }
}
