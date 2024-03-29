import fs from 'fs';
import path from 'path';
import './jest.extensions';

// https://github.com/testing-library/react-testing-library/issues/36#issuecomment-440442300
// https://github.com/testing-library/react-testing-library/issues/36#issuecomment-444580722
declare global {
  interface Window {
    Funnelbranch: any;
    funnelbranch: any;
    XMLHttpRequest: {
      open(): any;
      setRequestHeader(): any;
      send(): any;
    };
  }
  namespace jest {
    interface Expect {
      jsonStringContaining: (properties: any) => object;
    }
  }
}

describe('funnelbranch.js', () => {
  const SCRIPT_URL = `https://js.funnelbranch.com/funnelbranch.js`;

  /**
   * The variable below represents "window.Funnelbranch"
   *
   * I'm intentionally leaving it untyped to increase the probability of detecting breaking changes
   * (consumers of <script src="funnelbranch.js"> don't have type definitions either...)
   *
   * Consider switching to Puppeteer for running these tests
   * (something like: npx serve /build/funnelbranch.js && puppeteer /tests/webstore.html)
   */
  let Funnelbranch: any;
  let funnelbranch: any;

  function mockScriptTag(src: string) {
    const script = document.createElement('script');
    script.src = src;
    (document.querySelector as jest.Mock).mockReturnValue(script);
  }

  async function loadScript() {
    const funnelbranchJs = path.join(__dirname, '..', 'build', 'funnelbranch.js');
    const javascript = await fs.promises.readFile(funnelbranchJs, 'utf-8');
    eval(javascript);
    Funnelbranch = window.Funnelbranch;
    funnelbranch = window.funnelbranch;
  }

  beforeEach(async (done) => {
    // Mocks
    // @ts-ignore
    delete window.location;
    window.location = { pathname: '/' } as any;
    class MockXMLHttpRequest {
      static __OPEN = jest.fn().mockReset();
      static __SET_REQUEST_HEADER = jest.fn().mockReset();
      static __SEND = jest.fn().mockReset();
      open = MockXMLHttpRequest.__OPEN;
      setRequestHeader = MockXMLHttpRequest.__SET_REQUEST_HEADER;
      send = MockXMLHttpRequest.__SEND;
    }
    window.XMLHttpRequest = MockXMLHttpRequest as any;
    window.XMLHttpRequest.open = MockXMLHttpRequest.__OPEN;
    window.XMLHttpRequest.setRequestHeader = MockXMLHttpRequest.__SET_REQUEST_HEADER;
    window.XMLHttpRequest.send = MockXMLHttpRequest.__SEND;
    document.querySelector = jest.fn().mockName('document.querySelector').mockReset();
    // Spies
    jest.spyOn(console, 'warn').mockName('console.warn').mockReset();
    jest.spyOn(console, 'error').mockName('console.error').mockReset();
    // Load Script
    await loadScript();
    done();
  });

  afterEach(() => {
    funnelbranch?.destroy();
  });

  it('loads', () => {
    expect(Funnelbranch).toBeTruthy();
  });

  it('has a version', () => {
    // When
    const version = Funnelbranch.scriptVersion();
    // Then
    expect(version).toHaveLength(7);
  });

  it('initializes', () => {
    // When
    funnelbranch = Funnelbranch.initialize('proj_123');
    // Then
    expect(funnelbranch).toBeTruthy();
  });

  it('auto-initializes with a project ID in the query string', async () => {
    // Given
    mockScriptTag(`${SCRIPT_URL}?projectId=proj_abc123def`);
    // When
    await loadScript();
    // Then
    expect(window.XMLHttpRequest.send).toHaveBeenCalledTimes(1);
    funnelbranch.destroy();
  });

  it('auto-initializes with other options in the query string', async () => {
    // Given
    const options = [
      'projectId=proj_abc123def',
      'controlGroup=A',
      'cookieDomain=.funnelbranch.com',
      'enableLocalhost=true',
      'trackClientUrlChanges=false',
      'trackClientHashChanges=true',
    ];
    mockScriptTag(`${SCRIPT_URL}?${options.join('&')}`);
    // When
    await loadScript();
    // Then
    expect(funnelbranch.options).toEqual(
      jasmine.objectContaining({
        projectId: 'proj_abc123def',
        controlGroup: 'A',
        cookieDomain: '.funnelbranch.com',
        enableLocalhost: true,
        trackClientUrlChanges: false,
        trackClientHashChanges: true,
      })
    );
    funnelbranch.destroy();
  });

  it('does not auto-initialize without a project ID in the query string', async () => {
    // Given
    mockScriptTag(`${SCRIPT_URL}?cookieDomain`);
    // When
    await loadScript();
    // Then
    expect(window.XMLHttpRequest.send).not.toHaveBeenCalled();
  });

  it('fails initialization without a project ID', () => {
    // When
    const attempt = () => Funnelbranch.initialize();
    // Then
    expect(attempt).toThrowError('Funnelbranch: missing project ID');
  });

  it('initializes a second time idempotently for the same configuration', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123', { enableLocalhost: true, trackClientHashChanges: true });
    // When
    const funnelbranch2 = Funnelbranch.initialize('proj_123', { enableLocalhost: true, trackClientHashChanges: true });
    // Then
    expect(funnelbranch).toBe(funnelbranch2);
  });

  it('fails a second initialization (if a different project ID is used)', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    const attempt = () => Funnelbranch.initialize('proj_456');
    // Then
    expect(attempt).toThrowError('Funnelbranch: already initialized');
  });

  it('fails a second initialization (if different options are used)', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123', { trackClientUrlChanges: true });
    // When
    const attempt = () => Funnelbranch.initialize('proj_123', { trackClientUrlChanges: false });
    // Then
    expect(attempt).toThrowError('Funnelbranch: already initialized');
  });

  it('fails initialization if the default API endpoint is overridden with a falsy value', () => {
    // When
    const attempt = () => Funnelbranch.initialize('proj_123', { __apiEndpoint: null });
    // Then
    expect(attempt).toThrowError('Funnelbranch: missing API endpoint');
  });

  it('prints a warning for localhost', () => {
    // Given
    window.location.hostname = 'localhost';
    // When
    funnelbranch = Funnelbranch.initialize('proj_123');
    // Then
    expect(console.warn).toHaveBeenCalledWith('Funnelbranch: disabled on localhost');
  });

  it('does not print a warning for localhost when localhost is enabled', () => {
    // Given
    window.location.hostname = 'localhost';
    // When
    funnelbranch = Funnelbranch.initialize('proj_123', { enableLocalhost: true });
    // Then
    expect(console.warn).not.toHaveBeenCalledWith('Funnelbranch: disabled on localhost');
  });

  it('immediately submits the current URL with "XMLHttpRequest" if available', () => {
    // Given
    window.location.pathname = '/welcome';
    // When
    funnelbranch = Funnelbranch.initialize('proj_123');
    // Then
    expect(window.XMLHttpRequest.open).toHaveBeenCalledTimes(1);
    expect(window.XMLHttpRequest.open).toHaveBeenCalledWith('POST', expect.any(String), true);
    expect(window.XMLHttpRequest.setRequestHeader).toHaveBeenNthCalledWith(1, 'Content-Type', 'application/json');
    expect(window.XMLHttpRequest.setRequestHeader).toHaveBeenNthCalledWith(2, 'Script-Version', expect.any(String));
    expect(window.XMLHttpRequest.send).toHaveBeenCalledWith(
      expect.jsonStringContaining({
        projectId: 'proj_123',
        triggerType: 'url_visit',
        trigger: { url: '/welcome' },
      })
    );
  });

  it('logs an error when "XMLHttpRequest" is unavailable', () => {
    // Given
    window.location.pathname = '/welcome';
    // @ts-ignore
    delete window.XMLHttpRequest;
    // When
    funnelbranch = Funnelbranch.initialize('proj_123');
    // Then
    expect(console.error).toHaveBeenCalledWith(`Funnelbranch: 'XMLHttpRequest' unavailable`);
  });

  it('submits the new location when tracking client side URLs (funnelbranch:pushstate)', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    window.location.pathname = '/pushstate/index.html';
    window.dispatchEvent(new Event('funnelbranch:pushstate'));
    // Then
    expect(window.XMLHttpRequest.send).toHaveBeenCalledTimes(2);
    expect(window.XMLHttpRequest.send).toHaveBeenLastCalledWith(
      expect.jsonStringContaining({
        triggerType: 'url_visit',
        trigger: { url: '/pushstate/index.html' },
      })
    );
  });

  it('submits the new location when tracking client side URLs (popstate)', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    window.location.pathname = '/popstate/index.html';
    window.dispatchEvent(new Event('popstate'));
    // Then
    expect(window.XMLHttpRequest.send).toHaveBeenCalledTimes(2);
    expect(window.XMLHttpRequest.send).toHaveBeenLastCalledWith(
      expect.jsonStringContaining({
        triggerType: 'url_visit',
        trigger: { url: '/popstate/index.html' },
      })
    );
  });

  it('submits the new location when tracking client side URLs (hashchange)', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    window.location.pathname = '/hashchange/index.html';
    window.dispatchEvent(new Event('hashchange'));
    // Then
    expect(window.XMLHttpRequest.send).toHaveBeenCalledTimes(2);
    expect(window.XMLHttpRequest.send).toHaveBeenLastCalledWith(
      expect.jsonStringContaining({
        triggerType: 'url_visit',
        trigger: { url: '/hashchange/index.html' },
      })
    );
  });

  it('does not submit the same URL twice', () => {
    // Given
    window.location.pathname = '/pushstate/index.html';
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    window.dispatchEvent(new Event('funnelbranch:pushstate'));
    // Then
    expect(window.XMLHttpRequest.send).toHaveBeenCalledTimes(1);
    expect(window.XMLHttpRequest.send).toHaveBeenCalledWith(
      expect.jsonStringContaining({
        triggerType: 'url_visit',
        trigger: { url: '/pushstate/index.html' },
      })
    );
  });

  it('does not submit the new location when not tracking client side URLs (funnelbranch:pushstate)', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123', { trackClientUrlChanges: false });
    // When
    window.location.pathname = '/pushstate/index.html';
    window.dispatchEvent(new Event('funnelbranch:pushstate'));
    // Then
    expect(window.XMLHttpRequest.send).toHaveBeenCalledTimes(1);
    expect(window.XMLHttpRequest.send).not.toHaveBeenCalledWith(
      expect.jsonStringContaining({
        triggerType: 'url_visit',
        trigger: { url: '/pushstate/index.html' },
      })
    );
  });

  it('does not track hash changes by default', () => {
    // Given
    window.location.pathname = '/blog';
    window.location.hash = '';
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    window.location.pathname = '/blog';
    window.location.hash = '#conclusion';
    window.dispatchEvent(new Event('hashchange'));
    // Then
    expect(window.XMLHttpRequest.send).toHaveBeenCalledTimes(1);
    expect(window.XMLHttpRequest.send).toHaveBeenCalledWith(
      expect.jsonStringContaining({
        triggerType: 'url_visit',
        trigger: { url: '/blog' },
      })
    );
  });

  it('tracks hash changes when configured', () => {
    // Given
    window.location.pathname = '/blog';
    window.location.hash = '';
    funnelbranch = Funnelbranch.initialize('proj_123', { trackClientHashChanges: true });
    // When
    window.location.pathname = '/blog';
    window.location.hash = '#conclusion';
    window.dispatchEvent(new Event('hashchange'));
    // Then
    expect(window.XMLHttpRequest.send).toHaveBeenCalledTimes(2);
    expect(window.XMLHttpRequest.send).toHaveBeenNthCalledWith(
      1,
      expect.jsonStringContaining({
        triggerType: 'url_visit',
        trigger: { url: '/blog' },
      })
    );
    expect(window.XMLHttpRequest.send).toHaveBeenNthCalledWith(
      2,
      expect.jsonStringContaining({
        triggerType: 'url_visit',
        trigger: { url: '/blog#conclusion' },
      })
    );
  });

  it('stops tracking client side URLs upon destruction', () => {
    // Given
    window.location.pathname = '/welcome';
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    funnelbranch.destroy();
    window.location.pathname = '/popstate/index.html';
    window.dispatchEvent(new Event('popstate'));
    // Then
    expect(window.XMLHttpRequest.send).toHaveBeenCalledTimes(1);
    expect(window.XMLHttpRequest.send).toHaveBeenCalledWith(
      expect.jsonStringContaining({
        triggerType: 'url_visit',
        trigger: { url: '/welcome' },
      })
    );
  });

  it('submits an action', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    funnelbranch.submitAction('REGISTRATION');
    // Then
    expect(window.XMLHttpRequest.send).toHaveBeenCalledTimes(2);
    expect(window.XMLHttpRequest.send).toHaveBeenLastCalledWith(
      expect.jsonStringContaining({
        triggerType: 'action',
        trigger: { action: 'REGISTRATION' },
      })
    );
  });

  it('does not submit the same action twice', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    funnelbranch.submitAction('REGISTRATION');
    funnelbranch.submitAction('REGISTRATION');
    // Then
    expect(window.XMLHttpRequest.send).toHaveBeenCalledTimes(2);
    expect(window.XMLHttpRequest.send).toHaveBeenLastCalledWith(
      expect.jsonStringContaining({
        triggerType: 'action',
        trigger: { action: 'REGISTRATION' },
      })
    );
  });
});
