export class HttpError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}
