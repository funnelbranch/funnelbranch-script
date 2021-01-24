import { BotService } from './botService/botService';
import { CookieService } from './cookieService/cookieService';
import { HttpService } from './httpService/httpService';
import { LocationService } from './locationService/locationService';
import { deepEquals } from './utils/deepEquals';
import './utils/objectAssignPolyfill';

// Config
declare const BUILD_COMMIT_HASH: string;

// Types
type Options = {
  controlGroup?: 'A' | 'B';
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
  private static INST?: Funnelbranch;

  private static DEFAULT_OPTIONS: Options = {
    controlGroup: undefined,
    enableLocalhost: false,
    trackClientUrlChanges: true,
    trackClientHashChanges: false,
    __apiEndpoint: 'https://api.funnelbranch.com/m',
    __extraHeaders: {},
  };

  public static scriptVersion(): string {
    return BUILD_COMMIT_HASH;
  }

  public static initialize(projectId: string, options = {} as Options): Funnelbranch | undefined {
    if (!projectId) {
      throw new Error('Funnelbranch: missing project ID');
    }
    const finalOptions = Object.assign({}, this.DEFAULT_OPTIONS, options);
    if (!finalOptions.__apiEndpoint) {
      throw new Error('Funnelbranch: missing API endpoint');
    }
    if (this.INST) {
      if (this.INST.projectId === projectId && deepEquals(this.INST.options, finalOptions)) {
        return this.INST;
      }
      throw new Error('Funnelbranch: already initialized');
    }
    this.INST = new Funnelbranch(projectId, finalOptions);
    return this.INST;
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
    this.destroyed = true;
    this.locationService.destroy();
    Funnelbranch.INST = undefined;
  };

  public submitEvent = (event?: string): void => {
    if (event) {
      this.submitMatch({ event });
    }
  };

  private submitUrl = (location?: Location): void => {
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
    if (this.lastMatch && deepEquals(this.lastMatch, match)) {
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
}

Object.assign(window, { Funnelbranch });

// Auto-initialize
const script = document.querySelector<HTMLScriptElement>('script[src^="https://js.funnelbranch.com/funnelbranch.js"]');
if (script) {
  const pattern = /projectId=([\w_-]+)/;
  const match = pattern.exec(script.src);
  if (match) {
    const funnelbranch = Funnelbranch.initialize(match[1]);
    Object.assign(window, { funnelbranch });
  }
}
