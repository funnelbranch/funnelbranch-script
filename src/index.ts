import { BotService } from './botService/BotService';
import { BrowserService } from './browserService/browserService';
import { HistoryService } from './historyService/HistoryService';
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

// Service
class Funnelbranch {
  private static INIT = false;

  private static DEFAULT_OPTIONS: Options = {
    enableLocalhost: false,
    trackClientUrlChanges: true,
    trackClientHashChanges: false,
  };

  public static initialize(projectId: string, options: Options) {
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

  private localhost: boolean;
  private destroyed: boolean = false;
  private lastRequest?: SubmitMatchRequest;

  private constructor(private readonly projectId: string, private readonly options: Options) {
    this.localhost = HistoryService.getLocation().hostname === 'localhost';
    if (this.localhost && !options.enableLocalhost) {
      console.warn('Funnelbranch: disabled on localhost');
    }
    this.submitUrl(HistoryService.getLocation());
    HistoryService.trackSpaUrls(this.submitUrl);
  }

  public destroy = () => {
    this.destroyed = true;
    Funnelbranch.INIT = false;
  };

  public submitEvent = (event?: string) => {
    if (event) {
      this.submitMatch({ event });
    }
  };

  private submitUrl = (location?: Location) => {
    if (location) {
      const url = Funnelbranch.extractUrl(location);
      if (url) {
        this.submitMatch({ url });
      }
    }
  };

  private submitMatch = ({ url, event }: { url?: string; event?: string }) => {
    if (this.destroyed) {
      return;
    }
    if (this.localhost && !this.options.enableLocalhost) {
      return;
    }
    const request: SubmitMatchRequest = {
      projectId: this.projectId,
      controlGroup: this.options.controlGroup,
      visitorId: Funnelbranch.getVisitorId(),
      bot: BotService.isBot(),
      trigger: { url, event },
    };
    if (this.lastRequest && Funnelbranch.areTheSame(this.lastRequest, request)) {
      return; // Doesn't make sense for Funnelbranch to submit the same match twice
    }
    this.lastRequest = BrowserService.post(request);
  };

  private static extractUrl = (location: Location) => {
    let result = location.pathname;
    if (location.hash) {
      result += location.hash;
    }
    return result;
  };

  private static getVisitorId = () => {
    let visitorId = BrowserService.getVisitorCookie();
    if (!visitorId) {
      visitorId = `vis_${Math.random().toFixed(17).slice(2)}`;
      BrowserService.setVisitorCookie(visitorId);
    }
    return visitorId;
  };

  private static areTheSame(r1: SubmitMatchRequest, r2: SubmitMatchRequest) {
    return (
      r1.projectId === r2.projectId &&
      r1.controlGroup === r2.controlGroup &&
      r1.visitorId === r2.visitorId &&
      r1.trigger.url === r2.trigger.url &&
      r1.trigger.event === r2.trigger.event
    );
  }
}

Object.assign(window, { Funnelbranch });
