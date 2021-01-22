import { BrowserService } from '../browserService/browserService';

// Config
const PUSH_STATE_EVENT = 'funnelbranch_pushstate';

// Types
type LocationCallback = (location: Location) => void;

// Service
export class HistoryService {
  private static init = false;

  public static getLocation(): Location {
    if (!('location' in window)) {
      return {} as Location;
    }
    return window.location;
  }

  public static trackSpaUrls(callback: LocationCallback): void {
    if (!this.init) {
      this.setupPushStateEmitter();
      this.init = true;
    }
    this.listen([PUSH_STATE_EVENT, 'hashchange', 'popstate'], () => {
      callback(this.getLocation());
    });
  }

  private static setupPushStateEmitter(): void {
    if (!('history' in window) || !('pushState' in window.history)) {
      return;
    }
    const original = window.history.pushState;
    const emitPushState = () => BrowserService.emitEvent(PUSH_STATE_EVENT);
    window.history.pushState = function (...args) {
      const result = original.apply(this, args);
      emitPushState();
      return result;
    };
  }

  private static listen(events: string[], func: (event: Event) => void): void {
    for (let index = 0, total = events.length; index < total; index++) {
      window.addEventListener(events[index], func, false);
    }
  }
}
