import { Browser } from './browser/browser';
import { UrlService } from './urlService/UrlService';
import { Options, SubmitMatchRequest } from './types';

let initialized = false;

class Funnelbranch {
  public static initialize(options = {} as Options) {
    if (initialized) {
      console.error('Funnelbranch: already initialized');
      return;
    }
    if (typeof options.trackClientUrlChanges === 'undefined') {
      options.trackClientUrlChanges = true;
    }
    if (typeof options.submitOnLocalhost === 'undefined') {
      options.submitOnLocalhost = false;
    }
    const instance = new Funnelbranch(options);
    initialized = true;
    return instance;
  }

  private localhost: boolean;
  private destroyed: boolean = false;
  private lastRequest?: SubmitMatchRequest;

  private constructor(private readonly options: Options) {
    this.localhost = UrlService.getLocation().hostname === 'localhost';
    if (this.localhost && !options.submitOnLocalhost) {
      console.warn('Funnelbranch: disabled on localhost');
    }
    this.submitUrl(UrlService.getLocation());
    UrlService.trackSpaUrls(this.submitUrl);
  }

  public destroy = () => {
    this.destroyed = true;
    initialized = false;
  };

  public submitEvent = (event?: string) => {
    if (event && this.isSubmittable()) {
      this.submitMatch({
        projectId: this.options.projectId,
        controlGroup: this.options.controlGroup,
        visitorId: this.getVisitorId(),
        trigger: { event },
      });
    }
  };

  private submitUrl = (location?: Location) => {
    if (location && this.isSubmittable()) {
      const url = this.extractUrl(location);
      this.submitMatch({
        projectId: this.options.projectId,
        controlGroup: this.options.controlGroup,
        visitorId: this.getVisitorId(),
        trigger: { url },
      });
    }
  };

  private getVisitorId = () => {
    return Browser.getVisitorCookie() || Browser.setVisitorCookie(this.generateVisitorId());
  };

  private isSubmittable = () => {
    if (this.destroyed) {
      return false;
    }
    if (this.localhost && !this.options.submitOnLocalhost) {
      return false;
    }
    return true;
  };

  private submitMatch = (request: SubmitMatchRequest) => {
    if (this.lastRequest && this.areTheSame(this.lastRequest, request)) {
      return;
    }
    console.log(request);
    this.lastRequest = request;
  };

  private generateVisitorId = () => {
    return `vis_${Math.random().toFixed(8).slice(2)}`;
  };

  private extractUrl = (location: Location) => {
    let result = location.pathname;
    if (location.hash) {
      result += location.hash;
    }
    return result;
  };

  private areTheSame(r1: SubmitMatchRequest, r2: SubmitMatchRequest) {
    return (
      r1.projectId === r2.projectId &&
      r1.controlGroup === r2.controlGroup &&
      r1.visitorId === r2.visitorId &&
      r1.trigger.url === r2.trigger.url &&
      r1.trigger.event === r2.trigger.event
    );
  }
}

(window as any).Funnelbranch = Funnelbranch;
