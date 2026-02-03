import { describe, it, expect } from 'vitest';
import { sanitizeText } from '../sanitize';

describe('sanitizeText', () => {
  it('removes HTML tags', () => {
    expect(sanitizeText('<p>Hello</p>')).toBe('Hello');
    expect(sanitizeText('<div><span>Test</span></div>')).toBe('Test');
  });

  it('removes script tags and content', () => {
    expect(sanitizeText('<script>alert("xss")</script>Safe')).toBe('Safe');
  });

  it('removes dangerous attributes', () => {
    expect(sanitizeText('<img onerror="alert(1)" src="x">')).toBe('');
    expect(sanitizeText('<div onclick="evil()">Click</div>')).toBe('Click');
  });

  it('preserves plain text', () => {
    expect(sanitizeText('Normal text')).toBe('Normal text');
    expect(sanitizeText('Text with numbers 123')).toBe('Text with numbers 123');
  });

  it('preserves Romanian characters', () => {
    expect(sanitizeText('Brașov și București')).toBe('Brașov și București');
    expect(sanitizeText('Apartament în centru')).toBe('Apartament în centru');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
    expect(sanitizeText('\n\ttext\n')).toBe('text');
  });

  it('handles nested tags', () => {
    expect(sanitizeText('<div><p><strong>Bold</strong></p></div>')).toBe('Bold');
  });

  it('handles empty strings', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText('   ')).toBe('');
  });

  it('handles malformed HTML', () => {
    expect(sanitizeText('<p>Unclosed')).toBe('Unclosed');
    expect(sanitizeText('Text<br>')).toBe('Text');
  });

  it('removes link tags but keeps text', () => {
    expect(sanitizeText('<a href="http://evil.com">Click here</a>')).toBe('Click here');
  });

  it('handles HTML entities', () => {
    expect(sanitizeText('&lt;script&gt;')).toBe('&lt;script&gt;');
  });
});
