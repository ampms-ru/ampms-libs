import { Schema } from "effect";

export class UnknownYahooFinanceError extends Schema.TaggedError<UnknownYahooFinanceError>(
  "@ampms-libs/effect-yahoo-finance/UnknownYahooFinanceError",
)("UnknownYahooFinanceError", {
  code: Schema.String,
  description: Schema.String,
}) {}

export class NotFoundError extends Schema.TaggedError<NotFoundError>(
  "@ampms-libs/effect-yahoo-finance/NotFoundError",
)("NotFoundError", {
  code: Schema.Literal("Not Found"),
  description: Schema.String,
}) {}

export class BadRequestError extends Schema.TaggedError<BadRequestError>(
  "@ampms-libs/effect-yahoo-finance/BadRequestError",
)("BadRequestError", {
  code: Schema.Literal("Bad Request"),
  description: Schema.String,
}) {}

export class UnprocessableEntityError extends Schema.TaggedError<UnprocessableEntityError>(
  "@ampms-libs/effect-yahoo-finance/UnprocessableEntityError",
)("UnprocessableEntityError", {
  code: Schema.Literal("Unprocessable Entity"),
  description: Schema.String,
}) {}
