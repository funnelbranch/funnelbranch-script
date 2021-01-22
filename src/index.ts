import { BotService } from './botService/botService';
import { CookieService } from './cookieService/cookieService';
import { HistoryService } from './historyService/historyService';
import { HttpService } from './httpService/httpServicex';
import './polyfills/objectAssign';

// Types
type Options = {
  controlGroup?: string;
  enableLocalhost?: boolean;
  trackClientUrlChanges?: boolean;
  trackClientHashChanges?: boolean;
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
    enableLocalhost: false,
    trackClientUrlChanges: true,
    trackClientHashChanges: false,
  };

  public static initialize(projectId: string, options: Options): Funnelbranch | undefined {
    if (this.INIT) {
      console.error('Funnelbranch: already initialized');
      return;
    }
    if (!projectId) {
      console.error('Funnelbranch: missing project ID');
      return;
    }
    const instance = new Funnelbranch(projectId, Object.assign({}, this.DEFAULT_OPTIONS, options));
    this.INIT = true;
    return instance;
  }

  private botService: BotService;
  private cookieService: CookieService;
  private historyService: HistoryService;

  private destroyed: boolean;
  private localhost: boolean;
  private lastMatch?: SubmitMatchRequest;

  private constructor(private readonly projectId: string, private readonly options: Options) {
    // Services
    this.botService = new BotService();
    this.cookieService = new CookieService();
    this.historyService = new HistoryService();
    // Variables
    this.destroyed = false;
    this.localhost = this.historyService.getLocation().hostname === 'localhost';
    if (this.localhost && !options.enableLocalhost) {
      console.warn('Funnelbranch: disabled on localhost');
    }
    // URL tracking
    if (options.trackClientUrlChanges) {
      this.historyService.trackSpaUrls(this.submitUrl);
    }
    this.submitUrl(this.historyService.getLocation());
  }

  public destroy = (): void => {
    this.historyService.destroy();
    this.destroyed = true;
    Funnelbranch.INIT = false;
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
    if (this.lastMatch && Funnelbranch.areEqual(this.lastMatch, match)) {
      return; // Doesn't make sense for Funnelbranch to submit the same match twice
    }
    this.lastMatch = HttpService.post(match);
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

  private static areEqual(m1: SubmitMatchRequest, m2: SubmitMatchRequest): boolean {
    return (
      m1.projectId === m2.projectId &&
      m1.controlGroup === m2.controlGroup &&
      m1.visitorId === m2.visitorId &&
      m1.trigger.url === m2.trigger.url &&
      m1.trigger.event === m2.trigger.event
    );
  }
}

Object.assign(window, { Funnelbranch });
