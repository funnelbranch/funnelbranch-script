const VISITOR_COOKIE = 'funnelbranch_visitor';
const VISITOR_COOKIE_AGE = 3 * 24 * 60 * 60; // Three days

export class CookieService {
  constructor(private readonly cookieDomain?: string) {}

  public extendVisitor(value: string) {
    document.cookie = `${VISITOR_COOKIE}=${value};max-age=${VISITOR_COOKIE_AGE};path=/${this.cookieDomain || ''}`;
  }

  public getVisitor() {
    const cookies = document.cookie.split(';');
    for (let index = 0, length = cookies.length; index < length; index++) {
      const [name, value] = cookies[index].split('=');
      if (name.trim() === VISITOR_COOKIE) {
        return value.trim();
      }
    }
    return undefined;
  }
}
