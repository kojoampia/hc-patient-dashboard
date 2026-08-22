import { TestBed } from '@angular/core/testing';

import PageRibbonComponent from './page-ribbon.component';

describe('Page Ribbon Component', () => {
  /**
   * The component decides once, at construction, from `window.location.hostname`. jsdom lets that be redefined per
   * test, which is the only way to exercise both answers without a browser.
   */
  const atHostname = (hostname: string): PageRibbonComponent => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, hostname },
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [PageRibbonComponent] }).overrideTemplate(PageRibbonComponent, '');
    return TestBed.createComponent(PageRibbonComponent).componentInstance;
  };

  const original = window.location;

  afterAll(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });

  it('marks the quality box', () => {
    expect(atHostname('patient.healthconnect.local').ribbonEnv).toBe('dev');
  });

  it('marks a laptop', () => {
    expect(atHostname('localhost').ribbonEnv).toBe('dev');
    expect(atHostname('127.0.0.1').ribbonEnv).toBe('dev');
  });

  it('leaves production unmarked', () => {
    expect(atHostname('patient.abofonsa.com').ribbonEnv).toBeUndefined();
  });

  it('treats an unrecognised hostname as production', () => {
    // Errs towards showing nothing rather than towards decorating the live site: a hostname nobody anticipated is
    // far more likely to be a new production alias than a new test box.
    expect(atHostname('patient.example.net').ribbonEnv).toBeUndefined();
  });

  it('is not fooled by a hostname that merely contains the word local', () => {
    // `.local$` and not `local`, or `patient.localdomain.com` — a perfectly ordinary public name — would light up.
    expect(atHostname('patient.localdomain.com').ribbonEnv).toBeUndefined();
    expect(atHostname('mylocalhost.com').ribbonEnv).toBeUndefined();
  });
});
