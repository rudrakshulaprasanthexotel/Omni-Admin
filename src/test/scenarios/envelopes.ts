/**
 * The three error envelopes in play behind the Interaction Details page. Field
 * names differ entirely between them, so a scenario has to pick the right one
 * for the backend that answers.
 *
 * See the "three different error envelopes" table at the top of
 * `docs/INTERACTION_DETAILS_API_STATES.md`.
 */

const REQUEST_ID = '6da10c2e-1ef7-4206-98ce-410087c9a151';

/** data-engine and CMS: `ExceptionBody`. `errorCode` is a string. */
export function exceptionBody(
  statusCode: number,
  status: string,
  errorCode = '<server-defined>',
  errorMessage = '<server-defined>',
) {
  return { statusCode, status, errorCode, errorMessage };
}

/**
 * Ameyo appserver: `RESTAPIErrorResponseEntity`. `code` is a number here where
 * `ExceptionBody.errorCode` is a string.
 *
 * `message` is unreliable across states — it may be a machine-readable key
 * (#2, #5), `null` (#3, #8, #9 on 403), or `''` (#9 on 512), and when blank
 * the key moves into `info`, which is the localized-text field elsewhere.
 * Callers pass both fields explicitly rather than defaulting either.
 */
export function ameyoError(
  status: number,
  code: number,
  message: string | null,
  info: string,
) {
  return { message, code, info, status };
}

/**
 * The servlet-container body for the five uncaught `NullPointerException`
 * states (#3, #5, #8, #9, #10). Deliberately HTML, not JSON — the doc warns
 * these escape the envelope entirely, so consumers must never assume a
 * parseable error body.
 */
export function servletErrorPage(status = 500): string {
  return [
    '<!doctype html><html><head><title>HTTP Status ' + status + '</title></head>',
    '<body><h1>HTTP Status ' + status + ' - Internal Server Error</h1>',
    '<p><b>Type</b> Exception Report</p>',
    '<p><b>Message</b> java.lang.NullPointerException</p>',
    '</body></html>',
  ].join('');
}

/**
 * interaction-svc: `CommonResponse` with the error nested under `response`.
 * `message` carries a raw i18n key and `description` is only the HTTP reason
 * phrase, so `error_code` is the sole field with diagnostic value.
 *
 * Error responses correctly report `GET` via `request.getMethod()`; only the
 * success path mislabels the verb (see `interactionSvcSuccess`).
 */
export function interactionSvcError(
  httpCode: number,
  errorCode: string,
  message: string,
  description: string,
) {
  return {
    http_code: httpCode,
    method: 'GET',
    request_id: REQUEST_ID,
    response: {
      http_code: httpCode,
      error_data: { error_code: errorCode, message, description },
      data: null,
    },
  };
}

/**
 * interaction-svc 200. The `method` field is hardcoded to `POST` by the
 * controller even though this is a GET, so anything keying off it sees the
 * verb flip between success and failure on the same request. Reproduced
 * faithfully — a test asserting `GET` here would be asserting a fiction.
 */
export function interactionSvcSuccess(data: unknown[]) {
  return {
    http_code: 200,
    method: 'POST',
    request_id: REQUEST_ID,
    response: {
      http_code: 200,
      error_data: null,
      data,
    },
  };
}

/** CMS / data-engine `CommonResponse` list envelope with offset metadata. */
export function offsetEnvelope(response: unknown[], total = String(response.length)) {
  return {
    http_code: 200,
    method: 'GET',
    request_id: REQUEST_ID,
    response,
    metadata: {
      total,
      count: response.length,
      offset: 0,
      limit: 1000,
    },
  };
}

/** data-engine `CommonResponse` wrapping a single nested data object (#11). */
export function nestedDataEnvelope(data: unknown[]) {
  return {
    http_code: 200,
    method: 'GET',
    request_id: REQUEST_ID,
    response: {
      http_code: 200,
      error_data: null,
      data,
    },
  };
}

export { REQUEST_ID };
