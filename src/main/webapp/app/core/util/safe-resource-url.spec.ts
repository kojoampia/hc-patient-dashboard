import { isSafeResourceUrl } from './safe-resource-url';

describe('isSafeResourceUrl', () => {
  it('accepts absolute http and https URLs', () => {
    expect(isSafeResourceUrl('https://patient.abofonsa.com/doc.pdf')).toBe(true);
    expect(isSafeResourceUrl('http://localhost:8080/doc.pdf')).toBe(true);
  });

  it('accepts relative URLs, which is what this app actually uses', () => {
    // The one-argument URL constructor throws on these; resolving against the origin is what makes them work.
    expect(isSafeResourceUrl('/api/personal-documents/1/content')).toBe(true);
    expect(isSafeResourceUrl('content/images/logo.jpg')).toBe(true);
  });

  it('rejects javascript: URLs', () => {
    // The one that matters: this executes in the page's origin the moment the element is attached, and the JWT is in
    // localStorage.
    expect(isSafeResourceUrl('javascript:alert(document.domain)')).toBe(false);
    expect(isSafeResourceUrl('JavaScript:alert(1)')).toBe(false);
    expect(isSafeResourceUrl('  javascript:alert(1)')).toBe(false);
  });

  it('rejects data:, blob: and filesystem: URLs', () => {
    expect(isSafeResourceUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeResourceUrl('blob:https://example.com/1234')).toBe(false);
    expect(isSafeResourceUrl('filesystem:https://example.com/temporary/x')).toBe(false);
  });

  it('rejects empty and unparseable values rather than passing them through', () => {
    expect(isSafeResourceUrl(undefined)).toBe(false);
    expect(isSafeResourceUrl(null)).toBe(false);
    expect(isSafeResourceUrl('')).toBe(false);
    expect(isSafeResourceUrl('http://')).toBe(false);
  });
});
