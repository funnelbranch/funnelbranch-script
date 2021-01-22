import fs from 'fs';
import path from 'path';

declare global {
  interface Window {
    Funnelbranch: any;
  }
}

describe('funnelbranch.js', () => {
  let Funnelbranch: any;

  beforeEach(async () => {
    const script = path.join(__dirname, '..', 'build', 'funnelbranch.js');
    const js = await fs.promises.readFile(script, 'utf-8');
    eval(js);
    Funnelbranch = window.Funnelbranch;
  });

  it('loads', () => {
    expect(Funnelbranch).toBeTruthy();
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
    spyOn(console, 'warn');
    // When
    Funnelbranch.initialize('proj_123');
    // Then
    expect(console.warn).toHaveBeenCalledWith('Funnelbranch: disabled on localhost');
  });

  it('does not print a warning for localhost when localhost is enabled', () => {
    // Given
    spyOn(console, 'warn');
    // When
    Funnelbranch.initialize('proj_123', { enableLocalhost: true });
    // Then
    expect(console.warn).not.toHaveBeenCalledWith('Funnelbranch: disabled on localhost');
  });
});
