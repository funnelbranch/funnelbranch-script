const VISITOR_COOKIE = 'funnelbranch_visitor';
const VISITOR_COOKIE_AGE = 24 * 60 * 60;

export class CookieService {
  public setVisitor(value: string) {
    document.cookie = `${VISITOR_COOKIE}=${value};max-age=${VISITOR_COOKIE_AGE};path=/`;
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
