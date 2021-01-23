// Config
declare var COMMIT_HASH: string;

// Service
export class HttpService {
  public static post<R>(apiEndpoint: string, request: R, extraHeaders: Record<string, string> = {}): R | undefined {
    const headers = Object.assign({}, extraHeaders, {
      'Content-Type': 'application/json',
      'Script-Version': COMMIT_HASH,
    });
    const body = JSON.stringify(request);
    if ('fetch' in window) {
      fetch(apiEndpoint, { method: 'POST', body, headers });
      return request;
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send#example_post
    if ('XMLHttpRequest' in window) {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', apiEndpoint, true);
      for (let name in headers) {
        xhr.setRequestHeader(name, headers[name]);
      }
      xhr.send(body);
      return request;
    }
    console.error(`Funnelbranch: 'fetch' and 'XMLHttpRequest' both unavailable`);
  }
}
