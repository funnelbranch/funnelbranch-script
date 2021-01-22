// Config
const PUSH_STATE_EVENT = 'funnelbranch_pushstate';

// Types
type LocationCallback = (location: Location) => void;

// Service
export class HistoryService {
  private static SETUP = false;

  private static setupPushStateEmitter(): void {
    if (!('history' in window) || !('pushState' in window.history)) {
      return;
    }
    const original = window.history.pushState;
    window.history.pushState = function (...args) {
      const result = original.apply(this, args);
      HistoryService.emitEvent(PUSH_STATE_EVENT);
      return result;
    };
  }

  private static emitEvent(type: string): void {
    // Create
    let event;
    if (typeof Event === 'function') {
      event = new Event(type);
    } else if ('createEvent' in document) {
      event = document.createEvent('Event'); // Fix for IE
      event.initEvent(type, true, true);
    }
    // Dispatch
    if (event && 'dispatchEvent' in window) {
      window.dispatchEvent(event);
    }
  }

  private trackingCallback?: LocationCallback;
  private events = [PUSH_STATE_EVENT, 'hashchange', 'popstate'];

  public constructor() {}

  public trackSpaUrls(trackingCallback: LocationCallback) {
    if (!HistoryService.SETUP) {
      HistoryService.setupPushStateEmitter();
      HistoryService.SETUP = true;
    }
    this.trackingCallback = trackingCallback;
    for (let index = 0, total = this.events.length; index < total; index++) {
      window.addEventListener(this.events[index], this.notify);
    }
  }

  public getLocation = (): Location => {
    if (!('location' in window)) {
      return {} as Location;
    }
    return window.location;
  };

  public destroy = (): void => {
    for (let index = 0, total = this.events.length; index < total; index++) {
      window.removeEventListener(this.events[index], this.notify);
    }
  };

  private notify = (): void => {
    if (this.trackingCallback) {
      this.trackingCallback(this.getLocation());
    }
  };
}
