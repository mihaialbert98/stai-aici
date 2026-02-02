import sanitizeHtml from 'sanitize-html';

/** Strip all HTML tags — plain text only */
export function sanitizeText(input: string): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim();
}
