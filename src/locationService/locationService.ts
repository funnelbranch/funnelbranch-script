// Config
const PUSH_STATE_EVENT = 'funnelbranch:pushstate';

// Types
type LocationCallback = (location: Location) => void;

// Service
export class LocationService {
  private static SETUP = false;

  private static setupPushStateEmitter(): void {
    if (!('history' in window) || !('pushState' in window.history)) {
      return;
    }
    const original = window.history.pushState;
    window.history.pushState = function (...args) {
      const result = original.apply(this, args);
      LocationService.emitEvent(PUSH_STATE_EVENT);
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

  private callback?: LocationCallback;
  private events = [PUSH_STATE_EVENT, 'popstate', 'hashchange'];

  public getLocation = (): Location => {
    if (!('location' in window)) {
      return {} as Location;
    }
    return window.location;
  };

  public track(callback: LocationCallback) {
    if (!LocationService.SETUP) {
      LocationService.setupPushStateEmitter();
      LocationService.SETUP = true;
    }
    this.callback = callback;
    for (let index = 0, total = this.events.length; index < total; index++) {
      window.addEventListener(this.events[index], this.notify);
    }
  }

  public destroy = (): void => {
    for (let index = 0, total = this.events.length; index < total; index++) {
      window.removeEventListener(this.events[index], this.notify);
    }
  };

  private notify = (): void => {
    if (this.callback) {
      this.callback(this.getLocation());
    }
  };
}
