// Config
declare const BUILD_COMMIT_HASH: string;

// Service
export class HttpService {
  public static post<R>(apiEndpoint: string, request: R, extraHeaders: Record<string, string> = {}): R | undefined {
    const headers = Object.assign({}, extraHeaders, {
      'Content-Type': 'application/json',
      'Script-Version': BUILD_COMMIT_HASH,
    });
    const body = JSON.stringify(request);
    if ('XMLHttpRequest' in window) {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', apiEndpoint, true);
      for (let name in headers) {
        xhr.setRequestHeader(name, headers[name]);
      }
      xhr.send(body);
      return request;
    }
    console.error(`Funnelbranch: 'XMLHttpRequest' unavailable`);
  }
}
