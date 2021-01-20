export class Browser {
  private static API = 'https://api.funnelbranch.com';
  private static COOKIE = 'funnelbranch_visitor';
  private static AGE = 300;

  public static setVisitor(value: string) {
    document.cookie = `${this.COOKIE}=${value}; max-age=${this.AGE}`;
  }

  public static getVisitor() {
    const cookies = document.cookie.split(';');
    for (let index = 0, length = cookies.length; index < length; index++) {
      const [name, value] = cookies[index].split('=');
      if (name === this.COOKIE) {
        return value;
      }
    }
    return undefined;
  }

  public static post(url: string, body: Record<string, any>) {
    const contentTypeKey = 'Content-Type';
    const contentTypeValue = 'application/json';
    if ('fetch' in window) {
      fetch(`${this.API}${url}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { [contentTypeKey]: contentTypeValue },
      });
      return;
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send#example_post
    if ('XMLHttpRequest' in window) {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.API}${url}`, true);
      xhr.setRequestHeader(contentTypeKey, contentTypeValue);
      xhr.send(JSON.stringify(body));
      return;
    }
    console.error('Browser unsupported');
  }
}
