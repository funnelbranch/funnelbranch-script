// Config
const API_ENDPOINT = 'https://api.funnelbranch.com/m';

// Service
export class HttpService {
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
