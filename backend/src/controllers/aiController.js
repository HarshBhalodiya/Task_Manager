/**
 * AI controller — exposes the /api/ai/generate-description endpoint.
 *
 * Responsibility splits:
 *   - Rate limiting (Supplementary 2): max 1 AI request per task per minute.
 *   - Graceful degradation: any AI failure yields fallback:true so the app
 *     keeps working (the frontend shows a friendly message instead of a crash).
 *   - The actual upstream call lives in aiService, keeping this layer HTTP-only.
 */
const { generateDescription } = require('../services/aiService');

// In-memory rate-limit store. Key = "<userId>|<title lowercase>", value = the
// epoch ms of the last AI call for that task. Reset on process restart (fine
// for a lab application; a production version would use Redis).
const lastCallAt = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/** Returns an error message if the task is rate-limited, else null. */
function checkRateLimit(userId, title) {
  const key = `${userId}|${title.trim().toLowerCase()}`;
  const now = Date.now();
  const last = lastCallAt.get(key) || 0;

  if (now - last < RATE_LIMIT_WINDOW_MS) {
    const waitSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - last)) / 1000);
    return {
      rateLimited: true,
      message: `Rate limited: please wait ${waitSec}s before generating again for this task.`
    };
  }

  lastCallAt.set(key, now);
  return null;
}

/**
 * POST /api/ai/generate-description
 * Body: { title: string }
 *
 * Always answers 200 with the envelope below so the frontend never has to
 * branch on transport errors:
 *   success: { success: true, data: { description: string, fallback: boolean } }
 *   rate-limited: { success: false, rateLimited: true, error: string }
 */
async function generateDescriptionHandler(req, res, next) {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required to generate a description.'
      });
    }

    const limit = checkRateLimit(req.user.userId, title);
    if (limit) {
      return res.status(429).json({
        success: false,
        rateLimited: true,
        error: limit.message
      });
    }

    const description = await generateDescription(title);

    // fallback:true when the AI call could not be completed — the app must
    // keep functioning normally.
    if (!description) {
      return res.status(200).json({
        success: true,
        data: {
          description: '',
          fallback: true
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        description,
        fallback: false
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { generateDescriptionHandler };
