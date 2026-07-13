// Async error wrapper so route handlers can throw and stay DRY.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Centralized error -> JSON response.
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    // Avoid leaking stack traces in production responses.
    console.error('[ERROR]', err.message);
  }
  res.status(status).json({
    ok: false,
    error: err.code || 'server_error',
    message: err.expose ? err.message : 'Something went wrong on the server.',
  });
}

// Simple 400 helper that surfaces a safe message to the client.
export function badRequest(message, code = 'bad_request') {
  const e = new Error(message);
  e.status = 400;
  e.code = code;
  e.expose = true;
  return e;
}
