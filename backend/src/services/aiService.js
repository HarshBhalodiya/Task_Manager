/**
 * AI service — the ONLY piece of the app that talks to the external AI API.
 *
 * Security: the API key lives exclusively here, read from process.env
 * (populated from .env by dotenv). It is never exposed to the frontend and
 * never logged.
 *
 * Robustness: every call is wrapped so that any failure (missing key, network
 * error, HTTP error, timeout) resolves to null. The controller treats null as
 * "fallback" and the app keeps working — graceful degradation.
 *
 * We use Node's native fetch (Node 18+) rather than a vendor SDK, so the
 * feature has no extra dependency. This implementation talks to Groq's
 * OpenAI-compatible API (free tier, fast).
 */
// Groq — free tier, very fast, OpenAI-compatible API. The SSE stream frames
// are `data: {...}` JSON objects with choices[0].delta.content holding each
// chunk of generated text (terminated by `data: [DONE]`).
const GROQ_MODEL = 'openai/gpt-oss-120b';
const GROQ_STREAM_ENDPOINT =
  'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Read a SSE (Server-Sent Events) stream and resolve with the concatenated
 * text of every chunk. Both Groq (and OpenAI) stream each chunk as a
 * `data: {...}` JSON line (blank-line separated). We buffer partial lines and
 * parse them incrementally so we never choke on odd chunk boundaries.
 * @param {Response} response - fetch Response with a readable body.
 * @returns {Promise<string>} accumulated text.
 */
async function readGroqStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  const parts = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by blank lines; parse complete frames only.
    let sep = buffer.indexOf('\n\n');
    while (sep !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      const line = frame
        .split('\n')
        .find((l) => l.startsWith('data:'));
      if (line) {
        const payload = line.slice(5).trim();
        if (payload && payload !== '[DONE]') {
          try {
            const json = JSON.parse(payload);
            // Groq/OpenAI shape: choices[0].delta.content
            const chunk = json?.choices?.[0]?.delta?.content;
            if (typeof chunk === 'string' && chunk) parts.push(chunk);
          } catch {
            // ignore a malformed frame; keep streaming
          }
        }
      }

      sep = buffer.indexOf('\n\n');
    }
  }

  return parts.join('');
}

/**
 * Generate a short task description from a title.
 * @param {string} title - Task title to base the description on.
 * @returns {Promise<string|null>} description text, or null on any failure.
 */
async function generateDescription(title) {
  const apiKey = process.env.GROQ_API_KEY;

  // No key configured → fail soft (fallback path) rather than crash.
  if (!apiKey) {
    console.warn('[AI] GROQ_API_KEY not set; returning fallback');
    return null;
  }

  let lastError = null;

  // Retry once on transient failures (5xx or timeout). The upstream API is
  // occasionally slow/intermittent, and a single retry usually lands a success.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(GROQ_STREAM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          stream: true,
          messages: [
            {
              role: 'system',
              content: 'You write short, helpful task descriptions. Return only the description text with no preamble, no quotes, no bullet points.'
            },
            {
              role: 'user',
              content: `Write a short description for a task titled: "${title}"`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        }),
        signal: controller.signal
      });

      if (response.status >= 500) {
        // 5xx = transient upstream issue; retry.
        lastError = `Upstream error ${response.status}: ${response.statusText}`;
        console.warn(`[AI] ${lastError} (attempt ${attempt}); ${attempt < 2 ? 'retrying' : 'giving up'}`);
        if (attempt < 2) continue;
        return null;
      }
      if (!response.ok) {
        console.warn(
          `[AI] Upstream error ${response.status}: ${response.statusText}`
        );
        return null;
      }

      const content = await readGroqStream(response);
      if (typeof content !== 'string' || !content.trim()) {
        console.warn(
          '[AI] Empty/unexpected completion payload (silent fallback):',
          content
        );
        return null;
      }
      return content.trim();
    } catch (err) {
      const isTimeout = err && err.name === 'AbortError';
      lastError = isTimeout ? 'timeout' : err.message;
      console.warn(
        `[AI] Request failed: ${lastError} (attempt ${attempt}); ${attempt < 2 ? 'retrying' : 'giving up'}`
      );
      if (attempt < 2) continue;
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

module.exports = { generateDescription };
