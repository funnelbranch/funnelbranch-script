const VISITOR_COOKIE_NAME = 'funnelbranch_visitor';
const VISITOR_COOKIE_AGE = 24 * 60 * 60;
const API_ENDPOINT = 'https://api.funnelbranch.com/m';

export class BrowserService {
  public static setVisitorCookie(value: string) {
    document.cookie = `${VISITOR_COOKIE_NAME}=${value};max-age=${VISITOR_COOKIE_AGE};path=/`;
  }

  public static getVisitorCookie() {
    const cookies = document.cookie.split(';');
    for (let index = 0, length = cookies.length; index < length; index++) {
      const [name, value] = cookies[index].split('=');
      if (name.trim() === VISITOR_COOKIE_NAME) {
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

  public static post<R>(request: R): R | undefined {
    const contentTypeKey = 'Content-Type';
    const contentTypeValue = 'application/json';
    const body = JSON.stringify(request);
    if ('fetch' in window) {
      fetch(API_ENDPOINT, {
        method: 'POST',
        body,
        headers: { [contentTypeKey]: contentTypeValue },
      });
      return request;
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send#example_post
    if ('XMLHttpRequest' in window) {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', API_ENDPOINT, true);
      xhr.setRequestHeader(contentTypeKey, contentTypeValue);
      xhr.send(body);
      return request;
    }
    console.error(`Funnelbranch: 'fetch' and 'XMLHttpRequest' both unavailable`);
  }
}
