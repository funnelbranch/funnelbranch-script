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

  async function loadScript() {
    const funnelbranchJs = path.join(__dirname, '..', 'build', 'funnelbranch.js');
    const javascript = await fs.promises.readFile(funnelbranchJs, 'utf-8');
    eval(javascript);
    Funnelbranch = window.Funnelbranch;
    funnelbranch = undefined;
  }

  beforeEach(async (done) => {
    // Mocks
    // @ts-ignore
    delete window.location;
    window.location = { pathname: '/' } as any;
    window.fetch = jest.fn().mockName('fetch').mockReset();
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
    const script = document.createElement('script');
    script.src = 'https://js.funnelbranch.com/funnelbranch.js?projectId=proj_abc123def';
    (document.querySelector as jest.Mock).mockReturnValue(script);
    // When
    await loadScript();
    // Then
    expect(window.fetch).toHaveBeenCalled();
    window.funnelbranch.destroy();
  });

  it('does not auto-initialize without a project ID in the query string', async () => {
    // Given
    const script = document.createElement('script');
    script.src = 'https://js.funnelbranch.com/funnelbranch.js';
    (document.querySelector as jest.Mock).mockReturnValue(script);
    // When
    await loadScript();
    // Then
    expect(window.fetch).not.toHaveBeenCalled();
  });

  it('fails initialization without a project ID', () => {
    // When
    const attempt = () => Funnelbranch.initialize();
    // Then
    expect(attempt).toThrowError('Funnelbranch: missing project ID');
  });

  it('fails a second initialization', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    const attempt = () => Funnelbranch.initialize();
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

  it('immediately submits the current URL with "fetch" if available', () => {
    // Given
    window.location.pathname = '/welcome';
    // When
    funnelbranch = Funnelbranch.initialize('proj_123');
    // Then
    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(window.fetch).toHaveBeenCalledWith(
      'https://api.funnelbranch.com/m',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Script-Version': expect.any(String),
        },
        body: expect.jsonStringContaining({
          projectId: 'proj_123',
          trigger: { url: '/welcome' },
        }),
      })
    );
    expect(window.XMLHttpRequest.open).not.toHaveBeenCalled();
    expect(window.XMLHttpRequest.setRequestHeader).not.toHaveBeenCalled();
    expect(window.XMLHttpRequest.send).not.toHaveBeenCalled();
  });

  it('immediately submits the current URL with "XMLHttpRequest" if "fetch" is unavailable', () => {
    // Given
    window.location.pathname = '/welcome';
    // @ts-ignore
    delete window.fetch;
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
        trigger: { url: '/welcome' },
      })
    );
  });

  it('logs an error when neither "fetch" nor "XMLHttpRequest" is available', () => {
    // Given
    window.location.pathname = '/welcome';
    // @ts-ignore
    delete window.fetch;
    // @ts-ignore
    delete window.XMLHttpRequest;
    // When
    funnelbranch = Funnelbranch.initialize('proj_123');
    // Then
    expect(console.error).toHaveBeenCalledWith(`Funnelbranch: neither 'fetch' nor 'XMLHttpRequest' available`);
  });

  it('submits the new location when tracking client side URLs (funnelbranch:pushstate)', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    window.location.pathname = '/pushstate/index.html';
    window.dispatchEvent(new Event('funnelbranch:pushstate'));
    // Then
    expect(window.fetch).toHaveBeenCalledTimes(2);
    expect(window.fetch).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.jsonStringContaining({
          trigger: { url: '/pushstate/index.html' },
        }),
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
    expect(window.fetch).toHaveBeenCalledTimes(2);
    expect(window.fetch).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.jsonStringContaining({
          trigger: { url: '/popstate/index.html' },
        }),
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
    expect(window.fetch).toHaveBeenCalledTimes(2);
    expect(window.fetch).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.jsonStringContaining({
          trigger: { url: '/hashchange/index.html' },
        }),
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
    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.jsonStringContaining({
          trigger: { url: '/pushstate/index.html' },
        }),
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
    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(window.fetch).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.jsonStringContaining({
          trigger: { url: '/pushstate/index.html' },
        }),
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
    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.jsonStringContaining({
          trigger: { url: '/blog' },
        }),
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
    expect(window.fetch).toHaveBeenCalledTimes(2);
    expect(window.fetch).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({
        body: expect.jsonStringContaining({
          trigger: { url: '/blog' },
        }),
      })
    );
    expect(window.fetch).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({
        body: expect.jsonStringContaining({
          trigger: { url: '/blog#conclusion' },
        }),
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
    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(window.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.jsonStringContaining({
          trigger: { url: '/welcome' },
        }),
      })
    );
  });

  it('submits an event', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    funnelbranch.submitEvent('REGISTRATION');
    // Then
    expect(window.fetch).toHaveBeenCalledTimes(2);
    expect(window.fetch).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.jsonStringContaining({
          trigger: { event: 'REGISTRATION' },
        }),
      })
    );
  });

  it('does not submit the same event twice', () => {
    // Given
    funnelbranch = Funnelbranch.initialize('proj_123');
    // When
    funnelbranch.submitEvent('REGISTRATION');
    funnelbranch.submitEvent('REGISTRATION');
    // Then
    expect(window.fetch).toHaveBeenCalledTimes(2);
    expect(window.fetch).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.jsonStringContaining({
          trigger: { event: 'REGISTRATION' },
        }),
      })
    );
  });
});
