export function parseResponse(raw?: string): unknown {
  if (!raw) throw new Error('Empty AI response');
  // Strip reasoning model think-blocks (e.g. <think>...</think>) before any parsing
  const original = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Prefer content inside a fenced code block (``` or ```json)
  const fenceMatch = original.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  let candidate = fenceMatch ? fenceMatch[1].trim() : original;

  // Drop any leading noise up to the first brace/bracket
  const firstBrace = candidate.search(/[{[]/);
  if (firstBrace > 0) candidate = candidate.slice(firstBrace);

  // Helper: find first balanced JSON block (respects simple quoted strings)
  const findBalanced = (s: string): string | null => {
    const len = s.length;
    for (let i = 0; i < len; i++) {
      const open = s[i];
      if (open !== '{' && open !== '[') continue;
      const closing = open === '{' ? '}' : ']';
      let depth = 0;
      for (let j = i; j < len; j++) {
        const ch = s[j];
        if (ch === open) depth++;
        else if (ch === closing) depth--;
        else if (ch === '"' || ch === "'") {
          const quote = ch;
          j++;
          while (j < len) {
            if (s[j] === '\\') j += 2;
            else if (s[j] === quote) break;
            else j++;
          }
        }
        if (depth === 0) return s.slice(i, j + 1);
      }
    }
    return null;
  };

  // Try balanced extraction first
  const balanced = findBalanced(candidate);
  if (balanced) {
    try {
      return JSON.parse(balanced);
    } catch {
      // fall through to repair attempts
    }
  }

  // Try raw parse of candidate
  try {
    return JSON.parse(candidate);
  } catch {
    // continue
  }

  // Conservative repairs
  let s = candidate.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  // remove control chars
  s = s.replace(/[\u0000-\u001F\u007F]+/g, '');
  // remove trailing commas
  s = s.replace(/,\s*([\]}])/g, '$1');
  // quote unquoted simple keys: { key: -> { "key":
  s = s.replace(/([{,]\s*)([A-Za-z0-9_\-]+)\s*:/g, '$1"$2":');
  // single-quoted strings -> double quotes (heuristic)
  s = s.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');

  try {
    return JSON.parse(s);
  } catch {
  // attempt to balance braces/brackets
  }

  const openBraces = (s.match(/{/g) || []).length;
  const closeBraces = (s.match(/}/g) || []).length;
  const openBrackets = (s.match(/\[/g) || []).length;
  const closeBrackets = (s.match(/\]/g) || []).length;
  if (openBraces > closeBraces) s += '}'.repeat(openBraces - closeBraces);
  if (openBrackets > closeBrackets) s += ']'.repeat(openBrackets - closeBrackets);

  try {
    return JSON.parse(s);
  } catch {
    // last resort: crude slice between first/last braces or brackets
    const fObj = s.indexOf('{');
    const lObj = s.lastIndexOf('}');
    if (fObj !== -1 && lObj !== -1 && lObj > fObj) {
      const slice = s.slice(fObj, lObj + 1);
      try {
        return JSON.parse(slice);
      } catch {
        // continue
      }
    }
    const fArr = s.indexOf('[');
    const lArr = s.lastIndexOf(']');
    if (fArr !== -1 && lArr !== -1 && lArr > fArr) {
      const slice = s.slice(fArr, lArr + 1);
      try {
        return JSON.parse(slice);
      } catch {
        // continue
      }
    }
  }

  const snippet = original.slice(0, 2000);
  console.error('parseResponse failed to find/parse JSON. Snippet:', snippet);
  throw new Error('No JSON object/array found in AI response');
}