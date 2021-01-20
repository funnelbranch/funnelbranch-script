import { Browser } from './browser/browser';
import { Options, SubmitMatchRequest } from './types';

class Funnelbranch {
  public static initialize(options: Options) {
    return new Funnelbranch(options);
  }

  private visitorId: string;

  private constructor(private readonly options: Options) {
    // Retrieve or generate visitor ID
    let visitorId = Browser.getVisitor();
    if (visitorId) {
      console.log(`Re-using existing visitor ID: ${visitorId}`);
    } else {
      visitorId = this.generateVisitorId();
      Browser.setVisitor(visitorId);
      console.log(`NEW visistor ID: ${visitorId}`);
    }
    this.visitorId = visitorId;
    // TOOD: start tracking URLs
  }

  public submitUrl(url: string) {
    console.log(`Project: ${this.options.projectId}, Visitor: ${this.visitorId}, URL: ${url}`);
  }

  public submitEvent(event: string) {
    console.log(`Project: ${this.options.projectId}, Visitor: ${this.visitorId}, Event: ${event}`);
  }

  public destroy() {
    // TODO
  }

  private generateVisitorId() {
    return `vis_${Math.random().toFixed(8).slice(2)}`;
  }

  private submitMatch(request: SubmitMatchRequest) {
    // TODO
  }
}

(window as any).Funnelbranch = Funnelbranch;
