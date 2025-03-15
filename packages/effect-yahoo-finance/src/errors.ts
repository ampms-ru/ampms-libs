import { Data } from "effect";

export class YahooFinanceError extends Data.TaggedError("YahooFinanceError")<{
  readonly code: string;
  readonly description: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly code: "Not Found";
  readonly description: string;
}> {}

export class BadRequestError extends Data.TaggedError("BadRequestError")<{
  readonly code: "Bad Request";
  readonly description: string;
}> {}
