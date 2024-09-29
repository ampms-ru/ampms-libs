import crypto from "node:crypto";

import { HttpClient, HttpClientRequest, UrlParams } from "@effect/platform";
import { Effect, Match } from "effect";
import { UnauthorizedError } from "./errors";

export const makeBoerseFrankfurtHttpClient = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  return client.pipe(
    HttpClient.filterStatusOk,
    HttpClient.mapRequest(
      HttpClientRequest.prependUrl("https://api.boerse-frankfurt.de/v1"),
    ),
    HttpClient.mapRequest((req) => {
      const searchParams = UrlParams.toString(req.urlParams);
      const url = req.url + (searchParams ? `?${searchParams}` : "");
      const salt = "w4ivc1ATTGta6njAZzMbkL3kJwxMfEAKDa3MNr";
      const clientDate = new Date().toISOString();
      const nonce = clientDate + url + salt;
      const headers = {
        "Client-Date": clientDate,
        "X-Client-TraceId": crypto
          .createHash("md5")
          .update(nonce)
          .digest("hex"),
        "X-Security": crypto.createHash("md5").update(clientDate).digest("hex"),
      };

      return HttpClientRequest.setHeaders(req, headers);
    }),
    HttpClient.transformResponse((res) =>
      res.pipe(
        Effect.catchTag("ResponseError", (err) =>
          Match.value(err.response.status).pipe(
            Match.when(401, () => Effect.fail(new UnauthorizedError())),
            Match.orElse(() => Effect.fail(err)),
          ),
        ),
      ),
    ),
  );
});
