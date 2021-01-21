import { Browser } from '../browser/browser';
import { Config } from '../config';
import { LocationCallback } from '../types';

export class UrlService {
  private static pushStateEmitterSetup = false;

  public static getLocation(): Location {
    if (!('location' in window)) {
      return {} as Location;
    }
    return window.location;
  }

  public static trackSpaUrls(callback: LocationCallback): void {
    if (!this.pushStateEmitterSetup) {
      this.setupPushStateEmitter();
      this.pushStateEmitterSetup = true;
    }
    this.listen([Config.pushEventName, 'hashchange', 'popstate'], () => {
      callback(this.getLocation());
    });
  }

  private static setupPushStateEmitter(): void {
    if (!('history' in window) || !('pushState' in window.history)) {
      return;
    }
    const original = window.history.pushState;
    const emitPushState = () => Browser.emitEvent(Config.pushEventName);
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
