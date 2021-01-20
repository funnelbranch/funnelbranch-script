import { Message } from './message';

class Funnelbranch {
  private initialized = false;

  initialize(projectId: string) {
    if (this.initialized) {
      console.error('Funnelbranch is already initialized');
      return;
    }
    const message = `${Message.hello} ${Message.world}`;
    console.log(`Initialize: ${message} - ${projectId}`);
    this.initialized = true;
  }

  submitEvent(event: string) {
    console.log(`Event: ${event}`);
  }

  submitUrl(url: string) {
    console.log(`URL: ${url}`);
  }
}

(window as any).Funnelbranch = Funnelbranch;
// TODO: only auto-initialize if there's a Project ID in the script's query string - otherwise require manual initialization
if (true) {
  let funnelbranch = new Funnelbranch();
  funnelbranch.initialize('abc');
  (window as any).funnelbranch = funnelbranch;
}
