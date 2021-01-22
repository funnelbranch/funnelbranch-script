export class BotService {
  public static isBot() {
    // TODO: check for things like:
    //  - UA = bot,crawl,spider
    //  - PhantomJS, Cypress, Selenium
    return false;
  }
}
