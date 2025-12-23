export class ErrorResponse extends Error {
  constructor(message, { statusCode = 500, code, details, cause } = {}) {
    super(message);
    this.name = 'ErrorResponse';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    if (cause) this.cause = cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorResponse);
    }
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details
    };
  }

  send(res) {
    return res.status(this.statusCode).json(this.toJSON());
  }

  static from(error, { statusCode = 500, code, details } = {}) {
    if (error instanceof ErrorResponse) return error;
    const message = error?.message || 'Unexpected error';
    return new ErrorResponse(message, {
      statusCode,
      code,
      details,
      cause: error
    });
  }

  // Convenience factories
  static badRequest(message = 'Bad Request', options = {}) {
    return new ErrorResponse(message, { statusCode: 400, code: 'BAD_REQUEST', ...options });
  }

  static unauthorized(message = 'Unauthorized', options = {}) {
    return new ErrorResponse(message, { statusCode: 401, code: 'UNAUTHORIZED', ...options });
  }

  static forbidden(message = 'Forbidden', options = {}) {
    return new ErrorResponse(message, { statusCode: 403, code: 'FORBIDDEN', ...options });
  }

  static notFound(message = 'Not Found', options = {}) {
    return new ErrorResponse(message, { statusCode: 404, code: 'NOT_FOUND', ...options });
  }

  static internalServerError(message = 'Internal Server Error', options = {}) {
    return new ErrorResponse(message, { statusCode: 500, code: 'INTERNAL_SERVER_ERROR', ...options });
  }

}

export default ErrorResponse;


