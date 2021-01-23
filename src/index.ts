import { BotService } from './botService/botService';
import { CookieService } from './cookieService/cookieService';
import { LocationService } from './locationService/locationService';
import { HttpService } from './httpService/httpService';
import './polyfills/objectAssign';

// Config
declare var COMMIT_HASH: string;

// Types
type Options = {
  controlGroup?: string;
  enableLocalhost?: boolean;
  trackClientUrlChanges?: boolean;
  trackClientHashChanges?: boolean;
  __apiEndpoint?: string;
  __extraHeaders?: Record<string, string>;
};
type SubmitMatchRequest = {
  projectId: string;
  visitorId: string;
  controlGroup?: string;
  bot: boolean;
  trigger: {
    url?: string;
    event?: string;
  };
};

// Main class
class Funnelbranch {
  private static INIT = false;

  private static DEFAULT_OPTIONS: Options = {
    controlGroup: undefined,
    enableLocalhost: false,
    trackClientUrlChanges: true,
    trackClientHashChanges: false,
    __apiEndpoint: 'https://api.funnelbranch.com/m',
    __extraHeaders: {},
  };

  public static scriptVersion(): string {
    return COMMIT_HASH;
  }

  public static initialize(projectId: string, options: Options): Funnelbranch | undefined {
    if (this.INIT) {
      throw new Error('Funnelbranch: already initialized');
    }
    if (!projectId) {
      throw new Error('Funnelbranch: missing project ID');
    }
    const finalOptions = Object.assign({}, this.DEFAULT_OPTIONS, options);
    if (!finalOptions.__apiEndpoint) {
      throw new Error('Funnelbranch: missing API endpoint');
    }
    const instance = new Funnelbranch(projectId, finalOptions);
    this.INIT = true;
    return instance;
  }

  private botService: BotService;
  private cookieService: CookieService;
  private locationService: LocationService;

  private destroyed: boolean;
  private localhost: boolean;
  private lastMatch?: SubmitMatchRequest;

  private constructor(private readonly projectId: string, private readonly options: Options) {
    // Services
    this.botService = new BotService();
    this.cookieService = new CookieService();
    this.locationService = new LocationService();
    // Variables
    this.destroyed = false;
    this.localhost = this.locationService.getLocation().hostname === 'localhost';
    if (this.localhost && !options.enableLocalhost) {
      console.warn('Funnelbranch: disabled on localhost');
    }
    // URL tracking
    if (options.trackClientUrlChanges) {
      this.locationService.track(this.submitUrl);
    }
    this.submitUrl(this.locationService.getLocation());
  }

  public destroy = (): void => {
    this.locationService.destroy();
    this.destroyed = true;
    Funnelbranch.INIT = false;
  };

  public submitEvent = (event?: string): void => {
    if (event) {
      this.submitMatch({ event });
    }
  };

  private submitUrl = (location?: Location): void => {
    if (!this.options.trackClientUrlChanges) {
      console.log('Submitting', location);
    }
    if (location) {
      const url = this.extractUrl(location);
      if (url) {
        this.submitMatch({ url });
      }
    }
  };

  private submitMatch = (request: { url?: string; event?: string }): void => {
    if (this.destroyed) {
      return;
    }
    if (this.localhost && !this.options.enableLocalhost) {
      return;
    }
    const match: SubmitMatchRequest = {
      projectId: this.projectId,
      controlGroup: this.options.controlGroup,
      visitorId: this.getVisitorId(),
      bot: this.botService.isBot(),
      trigger: {
        url: request.url,
        event: request.event,
      },
    };
    if (this.lastMatch && Funnelbranch.deepEquals(this.lastMatch, match)) {
      return; // Doesn't make sense for us to submit the same match twice
    }
    this.lastMatch = HttpService.post(this.options.__apiEndpoint!, match, this.options.__extraHeaders);
  };

  private extractUrl = (location: Location): string => {
    let result = location.pathname;
    if (this.options.trackClientHashChanges && location.hash) {
      result += location.hash;
    }
    return result;
  };

  private getVisitorId = (): string => {
    let visitorId = this.cookieService.getVisitor();
    if (!visitorId) {
      visitorId = `vis_${Math.random().toFixed(17).slice(2)}`;
      this.cookieService.setVisitor(visitorId);
    }
    return visitorId;
  };

  private static deepEquals(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }
    if (this.isPrimitive(obj1) && this.isPrimitive(obj2)) {
      return obj1 === obj2;
    }
    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
      return false;
    }
    for (let key in obj1) {
      if (!(key in obj2)) {
        return false;
      }
      if (!this.deepEquals(obj1[key], obj2[key])) {
        return false;
      }
    }
    return true;
  }

  private static isPrimitive(obj: any) {
    return obj !== Object(obj);
  }
}

Object.assign(window, { Funnelbranch });
