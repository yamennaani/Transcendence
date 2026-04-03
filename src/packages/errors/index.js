class AppError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
    this.name = this.constructor.name
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404)
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400)
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409)
  }
}

module.exports = { AppError, NotFoundError, ValidationError, UnauthorizedError, ConflictError }