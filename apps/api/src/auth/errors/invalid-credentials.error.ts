const ERROR_MESSAGE = 'Invalid credentials.';

export class InvalidCredentialsError extends Error {
  status = 400;

  constructor () {
    super(ERROR_MESSAGE);
  }
}