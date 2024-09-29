import { Data } from "effect";

export class PriceHistoryError extends Data.TaggedError("PriceHistoryError")<{
  readonly messages: readonly string[];
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError") {}
