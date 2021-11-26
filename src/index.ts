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
  cookieDomain?: string;
  enableLocalhost?: boolean;
  trackClientUrlChanges?: boolean;
  trackClientHashChanges?: boolean;
  __apiEndpoint?: string;
  __extraHeaders?: Record<string, string>;
};
enum TriggerType {
  url_visit = 'url_visit',
  action = 'action',
}
type SubmitMatchRequest = {
  projectId: string;
  visitorId: string;
  controlGroup?: string;
  bot: boolean;
  triggerType: TriggerType;
  trigger: {
    url?: string;
    action?: string;
  };
};

// Main class
class Funnelbranch {
  private static INST?: Funnelbranch;

  private static DEFAULT_OPTIONS: Options = {
    controlGroup: undefined,
    cookieDomain: undefined,
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

  private constructor(public readonly projectId: string, public readonly options: Options) {
    // Services
    this.botService = new BotService();
    this.cookieService = new CookieService(options.cookieDomain);
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

  public submitAction = (action?: string): void => {
    if (action) {
      this.submitMatch({ triggerType: TriggerType.action, action });
    }
  };

  private submitUrl = (location?: Location): void => {
    if (location) {
      const url = this.extractUrl(location);
      if (url) {
        this.submitMatch({ triggerType: TriggerType.url_visit, url });
      }
    }
  };

  private submitMatch = (request: { triggerType: TriggerType; url?: string; action?: string }): void => {
    if (this.destroyed) {
      return;
    }
    if (this.localhost && !this.options.enableLocalhost) {
      return;
    }
    const match: SubmitMatchRequest = {
      projectId: this.projectId,
      controlGroup: this.options.controlGroup,
      visitorId: this.getAndExtendVisitorId(),
      bot: this.botService.isBot(),
      triggerType: request.triggerType,
      trigger: {
        url: request.url,
        action: request.action,
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

  /**
   * Either gets and extends the current visitor ID, or generates a new one
   *
   * @returns the visitor ID
   */
  private getAndExtendVisitorId = (): string => {
    const visitorId = this.cookieService.getVisitor() || `vis_${Math.random().toFixed(17).slice(2)}`;
    this.cookieService.extendVisitor(visitorId);
    return visitorId;
  };
}

Object.assign(window, { Funnelbranch });

// Auto-initialize
const script = document.querySelector<HTMLScriptElement>('script[src^="https://js.funnelbranch.com/funnelbranch.js\\?"]');
if (script) {
  const options: any = {};
  new URLSearchParams(script.src.substring(script.src.indexOf('?') + 1)).forEach((value, key) => {
    options[key] = value;
  });
  if (options.projectId) {
    // Convert boolean options
    const booleanOption: Array<keyof Options> = ['enableLocalhost', 'trackClientUrlChanges', 'trackClientHashChanges'];
    booleanOption.forEach((option) => {
      if (typeof options[option] === 'string') {
        (options[option] as boolean) = options[option] === 'true';
      }
    });
    const funnelbranch = Funnelbranch.initialize(options.projectId, options);
    Object.assign(window, { funnelbranch });
  }
}
