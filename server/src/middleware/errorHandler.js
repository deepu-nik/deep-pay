import { AppError } from "../utils/appError.js";

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(error, req, res, _next) {
  if (res.headersSent) return;

  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Something went wrong. Please try again.";
  let details;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error?.code === 11000) {
    statusCode = 409;
    code = "EMAIL_ALREADY_REGISTERED";
    message = "An account with this email already exists.";
  } else if (error?.name === "ValidationError" || error?.name === "CastError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "The submitted data is invalid.";
  } else if (error?.type === "entity.too.large") {
    statusCode = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request body is too large.";
  } else if (error?.type === "entity.parse.failed" || (error instanceof SyntaxError && error?.status === 400)) {
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Request body must contain valid JSON.";
  } else if (error?.statusCode === 403) {
    statusCode = 403;
    code = "CORS_ORIGIN_DENIED";
    message = "This origin is not allowed.";
  }

  if (statusCode >= 500) {
    console.error("[api:error]", {
      message: error?.message,
      method: req.method,
      path: req.path,
      stack: error?.stack,
    });
  }

  const payload = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(process.env.NODE_ENV === "development" && statusCode >= 500
        ? { debugMessage: error?.message }
        : {}),
    },
  };

  res.status(statusCode).json(payload);
}
