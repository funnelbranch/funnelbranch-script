import fs from 'fs';
import path from 'path';
import './jest.extensions';

// https://github.com/testing-library/react-testing-library/issues/36#issuecomment-440442300
// https://github.com/testing-library/react-testing-library/issues/36#issuecomment-444580722
declare global {
  interface Window {
    Funnelbranch: any;
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
   * (consumers of <script src="funnelbranch.js"> tag don't have type definitions either...)
   */
  let Funnelbranch: any;

  beforeEach(async () => {
    // Mocks
    // @ts-ignore
    delete window.location;
    window.location = {} as any;
    window.fetch = jest.fn().mockName('fetch').mockReset();
    // Spies
    jest.spyOn(console, 'warn').mockName('console.warn').mockReset();
    jest.spyOn(console, 'error').mockName('console.error').mockReset();
    // Script
    const funnelbranchJs = path.join(__dirname, '..', 'build', 'funnelbranch.js');
    const javascript = await fs.promises.readFile(funnelbranchJs, 'utf-8');
    eval(javascript);
    Funnelbranch = window.Funnelbranch;
  });

  it('loads', () => {
    expect(Funnelbranch).toBeTruthy();
  });

  it('has a version', () => {
    // When
    const version = Funnelbranch.scriptVersion();
    // Then
    expect(version).toHaveLength(6);
  });

  it('initializes', () => {
    // When
    const funnelbranch = Funnelbranch.initialize('proj_123');
    // Then
    expect(funnelbranch).toBeTruthy();
  });

  it('fails initialization without a project ID', () => {
    // When
    const attempt = () => Funnelbranch.initialize();
    // Then
    expect(attempt).toThrowError('Funnelbranch: missing project ID');
  });

  it('fails a second initialization', () => {
    // Given
    Funnelbranch.initialize('proj_123');
    // When
    const attempt = () => Funnelbranch.initialize();
    // Then
    expect(attempt).toThrowError('Funnelbranch: already initialized');
  });

  it('prints a warning for localhost', () => {
    // Given
    window.location.hostname = 'localhost';
    // When
    Funnelbranch.initialize('proj_123');
    // Then
    expect(console.warn).toHaveBeenCalledWith('Funnelbranch: disabled on localhost');
  });

  it('does not print a warning for localhost when localhost is enabled', () => {
    // Given
    window.location.hostname = 'localhost';
    // When
    Funnelbranch.initialize('proj_123', { enableLocalhost: true });
    // Then
    expect(console.warn).not.toHaveBeenCalledWith('Funnelbranch: disabled on localhost');
  });

  it('submits the current URL upon initialization', () => {
    // Given
    window.location.pathname = '/welcome';
    // When
    Funnelbranch.initialize('proj_123', { enableLocalhost: true });
    // Then
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
          visitorId: expect.any(String),
          bot: false,
          trigger: { url: '/welcome' },
        }),
      })
    );
  });
});
