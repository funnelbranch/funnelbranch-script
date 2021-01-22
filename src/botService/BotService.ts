export class BotService {
  public isBot() {
    // TODO: check for things like:
    //  - UA = bot,crawl,spider
    //  - PhantomJS, Cypress, Selenium
    return false;
  }
}
