import { Config } from '../config';

export class BrowserService {
  public static setVisitorCookie(value: string) {
    document.cookie = `${Config.visitorCookieName}=${value};max-age=${Config.visitorCookieAge};path=/`;
    return value;
  }

  public static getVisitorCookie() {
    const cookies = document.cookie.split(';');
    for (let index = 0, length = cookies.length; index < length; index++) {
      const [name, value] = cookies[index].split('=');
      if (name.trim() === Config.visitorCookieName) {
        return value.trim();
      }
    }
    return undefined;
  }

  public static emitEvent(type: string) {
    // Create
    let event;
    if (typeof Event === 'function') {
      event = new Event(type);
    } else if ('createEvent' in document) {
      event = document.createEvent('Event'); // Fix for IE
      event.initEvent(type, true, true);
    }
    // Dispatch
    if (event && 'dispatchEvent' in window) {
      window.dispatchEvent(event);
    }
  }

  public static post(request: Record<string, any>) {
    const contentTypeKey = 'Content-Type';
    const contentTypeValue = 'application/json';
    const body = JSON.stringify(request);
    if ('fetch' in window) {
      fetch(Config.apiEndpoint, {
        method: 'POST',
        body,
        headers: { [contentTypeKey]: contentTypeValue },
      });
      return;
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send#example_post
    if ('XMLHttpRequest' in window) {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', Config.apiEndpoint, true);
      xhr.setRequestHeader(contentTypeKey, contentTypeValue);
      xhr.send(body);
      return;
    }
    console.error(`Funnelbranch: 'fetch' and 'XMLHttpRequest' both unavailable`);
  }
}
