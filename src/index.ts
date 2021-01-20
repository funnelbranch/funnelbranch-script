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

  event(name: string) {
    console.log(`Event: ${name}`);
  }
}

const funnelbranch = new Funnelbranch();
// TODO: only auto-initialize if there's a Project ID in the script's query string - otherwise require manual initialization
funnelbranch.initialize('abc');
Object.assign(window, { funnelbranch });
