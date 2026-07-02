const ENTITIES: Record<string, string> = {
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&#39;': "'",
  '&apos;': "'",
};

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&quot;|&amp;|&lt;|&gt;|&#39;|&apos;/g, (match) => ENTITIES[match] ?? match);
}

export function extractTag(html: string, matcher: RegExp): string | null {
  const match = html.match(matcher);
  return match ? match[0] : null;
}

export function extractAttr(tag: string | null, attr: string): string | null {
  if (!tag) return null;
  const doubleQuoted = tag.match(new RegExp(`${attr}="([^"]*)"`));
  if (doubleQuoted) return doubleQuoted[1];
  const singleQuoted = tag.match(new RegExp(`${attr}='([^']*)'`));
  return singleQuoted ? singleQuoted[1] : null;
}
