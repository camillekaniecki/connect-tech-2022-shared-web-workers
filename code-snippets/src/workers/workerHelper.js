export default class WorkerHelper {
  /*
  * Instantiate the Web Worker
  * Trigger an event message externally towards the worker script
  * Receive the message from the worker script and handle the event call
  * External listeners listen on that event and trigger their own callback
  */
  constructor() {
    if (window.Worker) {
      this.worker = new Worker('/workers/worker.js');
      this.events = {};

      this.worker.addEventListener(
        'message',
        (e) => this.callEventCallback(e.data),
        false,
      );

      this.worker.addEventListener(
        'error',
        () => this.callEventCallback('error'),
        false,
      );
    }
  }

  trigger(eventName, data) {
    // Trigger an event message towards the worker script
    this.worker.postMessage({
      eventName,
      data,
    });
  }

  clearAllTimers() {
    // Clears all timers
    this.worker.postMessage({
      eventName: 'clearAllTimers',
    });
  }

  terminate() {
    // Terminates the worker thread with its events and timers
    this.clearAllTimers();
    this.worker.terminate();
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
