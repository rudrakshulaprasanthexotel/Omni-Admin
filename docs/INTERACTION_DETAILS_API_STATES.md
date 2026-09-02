# Interaction Details — API Response States

Every response state of every API behind the Interaction Details page, written out in full. Each section is self-contained.

Sources: `data-engine-apis.swagger.json` (OpenAPI 3.1.0, 101 paths) and `cms-apis-swagger.json` (OpenAPI 3.1.0, 834 paths), plus implementation detail supplied for the six Ameyo appserver endpoints and for interaction-svc. One API remains uncovered and is marked **API details not found**: #13 (CQA quality analysis, unwired).

Out of scope: voice recording playback, voice recording download, and chat transcript. Those three fetch server-supplied opaque URLs as blobs and are not covered here.

There are **three different error envelopes** in play:

| Backend | Envelope | Error fields | Extra codes |
| --- | --- | --- | --- |
| data-engine, CMS | `ExceptionBody` | `statusCode`, `status`, `errorCode`, `errorMessage` | — |
| Ameyo appserver (`/ameyorestapi`) | `RESTAPIErrorResponseEntity` | `message`, `code` (numeric), `info`, `status` | `405`, `512` |
| interaction-svc | `CommonResponse` with nested `error_data` | `error_code`, `message` (raw i18n key), `description` | `406` |

See #2 for the Ameyo shape and #7 for the interaction-svc shape. The `error_code` string `CONF-1001` appears in two of them meaning different things, so a code is only interpretable alongside the service that returned it.

Five states escape all three envelopes: the uncaught `500` on #3, #5, #8, #9, and #10. Each is an unhandled `NullPointerException`, so the body is whatever the servlet container renders — possibly an HTML error page rather than JSON. Never assume a parseable error body.

Note on error examples: the swagger specs carry exactly one `errorCode` example between them (`CONF-1001`, on the schema definition) and no per-endpoint or per-state examples. Where `errorCode` and `errorMessage` appear as `<server-defined>` below, the schema declares the field but the spec does not supply a value.

## Coverage

|  | API | Spec | States |
| --- | --- | --- | --- |
| 1 | Interaction list | data-engine | 200, 400, 401, 403, 404, 500 |
| 2 | Assigned campaigns | Ameyo appserver | 200, 401, 403, 404, 405, 512 |
| 3 | Assigned processes | Ameyo appserver | 200, 401, 403, 404, 405, 500, 512 |
| 4 | Campaign queues | cms | 200, 400, 401, 403, 404, 500 |
| 5 | Campaign disposition codes | Ameyo appserver | 200, 400, 401, 403, 404, 405, 500, 512 |
| 6 | Campaign users | cms | 200, 400, 401, 403, 404, 500 |
| 7 | Interaction timeline | interaction-svc | 200, 400, 401, 403, 404, 405, 406, 500 (11 `error_code` values) |
| 8 | All contact-center users | Ameyo appserver | 200, 401, 403, 404, 405, 500, 512 |
| 9 | Campaigns assigned by user | Ameyo appserver | 200, 401, 403, 404, 405, 500, 512 |
| 10 | Customer info | Ameyo appserver | 200, 400, 401, 404, 405, 500 (no `403`/`512` — no privilege check) |
| 11 | QA denominator (unwired) | data-engine | 200, 400, 401, 403, 404, 500 |
| 12 | Interaction QA scores (unwired) | data-engine | 200, 400, 401, 403, 404, 500 |
| 13 | CQA quality analysis (unwired) | — | **API details not found** |

The two swagger specs are uniform on their state sets. All 102 data-engine operations declare exactly `200`/`400`/`401`/`403`/`404`/`500`. CMS declares the same five error codes on all 1190 operations and adds `201`, `204`, and `409` on endpoints elsewhere in the spec — none on the endpoints used here. Neither spec declares `429`, `502`, `503`, or `504` anywhere.

The Ameyo appserver endpoints do not follow that pattern, and they are not uniform among themselves either. The common core is `200`/`401`/`403`/`404`/`405`/`512`, with a `512` where the swagger endpoints would return `500`. On top of that core, #3, #5, #8, #9, and #10 each add a bare `500` from an uncaught `NullPointerException` whose body is **not** the standard error envelope. Counts: six states on #2 and #10, seven on #3, #8, and #9, eight on #5.

**#10 is the exception to nearly every rule here.** It has no `403` and no `512` because it runs no privilege check at all, returns a single object rather than a list, and folds backend faults into `404`. See its section — the missing authorization is worth a look independently of this document.

**Only #5 and #10 have a `400`.** Elsewhere on the Ameyo surface, bad client input is reported as a `512` — #9 returns `512` for a missing or unknown `userId` — so on those endpoints no status distinguishes a client mistake from a server fault.

The `405`-on-`info=true` behaviour is consistent across #2, #3, #5, #8, and #9: `readResourceView` unconditionally throws `ProAPIMethodNotImplemented`, so the `info` parameter is never a usable route to richer data. #8 is the one to watch, since its client wrapper still exposes the parameter. #10 is the only endpoint free of the trap, having no `info` parameter at all.

The `RESTAPIErrorResponseEntity` fields are not filled consistently either. `message` may hold a machine-readable key (#2, #5), `null` (#3, #8, #9 on `403`), or an empty string (#9 on `512`), and when it is blank the key moves to `info`, which is the localized-text field elsewhere. Read both.

interaction-svc (#7) is different again — eight HTTP codes including a `406`, and eleven `error_code` values, four of them behind `404` alone. There the HTTP status is too coarse to act on; `error_data.error_code` is the field that identifies the actual condition.

---

# 1. Interaction list

`GET /data-engine/v1/cc-list/{ccId}/process-list/{processId}/interactions`
Spec: `data-engine-apis.swagger.json` → `getInteractionWithFilter`

## 200 — Fetched Interaction Data Successfully

Schema: `CommonResponseListCustomDataResponseInteractionOutPutBeanCustomCursorMetadata` (`application/json`)

```json
{
  "http_code": 200,
  "method": "GET",
  "request_id": "6da10c2e-1ef7-4206-98ce-410087c9a151",
  "response": [
    {
      "http_code": 200,
      "error_data": "Invalid input for parameter",
      "data": { "...InteractionOutPutBean" }
    }
  ],
  "metadata": {
    "total_string": "25000",
    "count": 100,
    "limit": 100,
    "first_page_url": "/v2/accounts/<account_sid>/users",
    "prev_page_url": "/v2/accounts/<account_sid>/users?before=<before-cursor>",
    "next_page_url": "/v2/accounts/<account_sid>/users?after=<after-cursor>"
  }
}
```

Rows and cursors are written to the slice by `fetchInteractions.fulfilled` (`interactionsSlice.ts:145`).

Each entry in `response[]` carries its **own** `http_code` and `error_data`, so a transport-level `200` can contain individually failed rows. The client ignores both — `asyncActions.ts:139-141` maps `entry.data` and filters out nulls — so a failed row silently disappears from the grid and the page comes back short with no explanation.

`metadata.total_string` is a **string**: an exact count (`"1000"`), a lower bound (`"1000+"`, `"more than 1000"`), or `"many"`. `parseTotal` (`interactionsSlice.ts:71`) returns `-1` for the unparseable cases and the pager hides the total badge.

`InteractionOutPutBean` fields: `id`, `title`, `customerId`, `customerName`, `lastAssignedUserId`, `lastAssignedUserName`, `contactCenterId`, `processId`, `lastCampaignId`, `lastCampaignName`, `lastQueueId`, `lastQueueName`, `lastDisposition`, `interactionMediaId`, `channelName`, `subChannel`, `direction`, `dateAdded`, `dateModified`, `dateDisposed`, `interactionRelationId`, `status`, `reopenCount`, `reopenTime`, `firstAssignedDate`, `assignedDate`, `linkedObjects`, `channelData`, `relatedInteractions`, `linkedConnectorId`, `applicationInstanceId`, `additionalInfo`, `scopeId`, `universalCustomerId`.

## 400 — Bad Request

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 400, "status": "Bad Request", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

Likely trigger: malformed `date_range`, an invalid cursor, or a bad filter value. `fetchInteractions.rejected` clears `rows`, nulls both cursors, and zeroes the counts (`interactionsSlice.ts:159`).

## 401 — Unauthorized

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 401, "status": "Unauthorized", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

Expired JWT. The response interceptor (`apiClient/index.ts:72`) refreshes the token single-flight and retries once; only a failed refresh reaches the grid, and by then the session has been torn down.

## 403 — Forbidden

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 403, "status": "Forbidden", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

Supervisor lacks rights on the contact centre, process, or campaign. Grid clears.

## 404 — Not Found

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 404, "status": "Not Found", "errorCode": "CONF-1001", "errorMessage": "Object doesn't exist" }
```

Unknown `ccId` or `processId`. Grid clears.

## 500 — Internal Server Error

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 500, "status": "Internal Server Error", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

Grid clears. Indistinguishable from `400`, `403`, and `404` in the UI.

---

# 2. Assigned campaigns

`GET /ameyorestapi/cc/campaigns/getAssigned?sessionId={sessionId}`

Not in either swagger file — states below are from the Ameyo appserver implementation.

This endpoint does **not** use the `ExceptionBody` envelope that the data-engine and CMS endpoints share. All of its error states return `RESTAPIErrorResponseEntity`, and it emits two codes that appear nowhere in the swagger specs: `405` and the non-standard `512`.

## 200 — OK

`Response.Status.OK`. Body is a JSON array of `CampaignProAPIOutputBean`. An empty array is still a `200`.

```json
[
  {
    "campaignId": 12,
    "campaignName": "Outbound Sales",
    "campaignType": "InteractiveVoiceApplication",
    "description": "…",
    "processId": 3,
    "contactCenterId": 1
  }
]
```

The client's `AssignedCampaign` interface (`supervisorApis.ts:30`) omits `description`; the extra field is simply ignored.

## Shared error envelope — `RESTAPIErrorResponseEntity`

Every error state below returns this shape:

```json
{
  "message": "invalid.authentication.token",
  "code": 909090,
  "info": "…localized text…",
  "status": 401
}
```

| Field | Description |
| --- | --- |
| `message` | Machine-readable key (e.g. `invalid.authentication.token`, `user.not.found`) |
| `code` | Numeric Ameyo error code |
| `info` | Localized human-readable text |
| `status` | Mirrors the HTTP status |

Note the field names differ entirely from `ExceptionBody` — `message`/`code`/`info`/`status` rather than `errorMessage`/`errorCode`/`statusCode`/`status`, and `code` is a number here where `errorCode` is a string there. Any shared error-rendering helper has to handle both.

## 401 — Unauthorized

Thrown by `RESTAuthenticationException`.

```json
{ "message": "invalid.authentication.token", "code": 909090, "info": "…", "status": 401 }
```

Triggered by a missing, blank, or invalid session token at the auth filter — but **only when `secure.mode=true`** — or by a `ProAPIAuthenticationException` from the privilege helper.

The response interceptor (`apiClient/index.ts:72`) intercepts this before feature code sees it, refreshing the token single-flight and retrying once.

## 403 — Forbidden

Thrown by `RESTAuthorizationException`.

```json
{ "message": "…", "code": 0, "info": "…", "status": 403 }
```

Two triggers: `sessionId` resolves to `null` in both the input bean and the auth token, or `GetContactCenterByIdPrivilegeHelper` rejects the user with a `PrivilegeException`.

## 404 — Not Found

Thrown by `RESTResourceNotFoundException` when `responseBean == null`.

```json
{ "message": "…", "code": 0, "info": "…", "status": 404 }
```

Practically unreachable on this endpoint — the custom command always returns a list — but the branch exists.

## 405 — Method Not Allowed

Thrown by `RESTMethodNotAllowedException`.

```json
{ "message": "method.not.allowed", "code": 0, "info": "…", "status": 405 }
```

Triggered by `?info=true`: `CampaignGetAssignedProAPICommand.readResourceView` unconditionally throws `ProAPIMethodNotImplemented("method.not.allowed")`. Also returned by JAX-RS for any non-`GET` verb.

**This is a live trap.** The sibling endpoint #5 (`dispositionCodes/getByCampaign`) takes an `info` parameter and the client passes `info=false` explicitly (`supervisorApis.ts:219`). `getAssignedCampaigns` correctly omits it (`supervisorApis.ts:141`), but adding `info=true` here to get richer campaign data would turn a working call into a hard `405`.

## 512 — Internal Server Error

Thrown by `RESTInternalServerException`. Non-standard code, outside the IANA registry.

```json
{ "message": "user.not.found", "code": 0, "info": "…", "status": 512 }
```

Raised by any `ProAPICommandExecutionException`:

- contact-center lookup for the session fails
- `PrivilegeProcessingException`
- CC-user fetch fails
- CC user is `null` → `user.not.found`
- `processUserIds` is `null` → `user.not.assigned.to.any.campaign`
- process-user or campaign-context fetch fails

The last two are the interesting ones: a correctly authenticated supervisor who simply has no campaign assignments gets a `512`, not an empty `200`. Since axios treats any 5xx as an error, that user's campaign selector fails to load rather than showing "no campaigns".

## How the client handles all of the above

`fetchAssignedCampaigns.rejected` (`interactionsSlice.ts:177`) stores the normalised error in `campaignsError` regardless of code and the campaign selector renders empty. Nothing reads `message`, `code`, or `info`, so `user.not.assigned.to.any.campaign` (a benign, actionable state) is indistinguishable from a genuine server fault.

---

# 3. Assigned processes

`GET /ameyorestapi/cc/processes/getAssigned?sessionId={sessionId}`

Not in either swagger file — states below are from the Ameyo appserver implementation.

Closely parallels #2, with one significant addition: this endpoint has **seven** states, not six. Alongside the handled `512` it can also emit a bare `500` from an uncaught `NullPointerException`.

## 200 — OK

`Response.Status.OK`. Body is a JSON array of `ProcessProAPIOutputBean`. An empty array is still a `200`.

```json
[
  {
    "processId": 3,
    "processName": "Sales Process",
    "description": "…",
    "processType": "InboundProcess"
  }
]
```

**This bean carries no `contactCenterId`**, unlike the campaigns bean in #2. The client's `AssignedProcess` interface declares `contactCenterId?` (`supervisorApis.ts:38`), which the server never sends — so that field is always `undefined`. Harmless today: nothing reads it. `InteractionDetailsPage.tsx:316` resolves the contact-centre id from `activeCampaign?.contactCenterId ?? sessionCcId`, sourcing it from the campaign bean and the login response rather than from a process. Any future code that reaches for `process.contactCenterId` will silently get `undefined`.

## Error envelope — `RESTAPIErrorResponseEntity`

All six error states below return the same shape as #2:

```json
{
  "message": "invalid.authentication.token",
  "code": 909090,
  "info": "…localized text…",
  "status": 401
}
```

## 401 — Unauthorized

Thrown by `RESTAuthenticationException`.

```json
{ "message": "invalid.authentication.token", "code": 909090, "info": "…", "status": 401 }
```

`RestAuthenticationRequestFilter` rejects the token — **only when `secure.mode=true`** — or `GetContactCenterByIdPrivilegeHelper` throws an `AuthenticationException`.

Intercepted by `apiClient/index.ts:72`, which refreshes the token single-flight and retries once before feature code sees it.

## 403 — Forbidden

Thrown by `RESTAuthorizationException`.

```json
{ "message": null, "code": 99999, "info": "invalid.session.id", "status": 403 }
```

Triggered when `sessionId` is `null` in both the input bean and the auth token, or when `GetContactCenterByIdPrivilegeHelper` throws a `PrivilegeException`.

Note the field usage inverts here: `message` is `null` and the machine-readable key `invalid.session.id` sits in `info`, which is the localized-text field everywhere else. Any consumer keying off `message` will get nothing for this state.

## 404 — Not Found

Thrown by `RESTResourceNotFoundException` when `responseBean == null`.

```json
{ "message": "requested.resource.not.found", "code": 99999, "info": "…", "status": 404 }
```

Unreachable in practice — the command always returns a list — but the branch exists.

## 405 — Method Not Allowed

Thrown by `RESTMethodNotAllowedException`.

```json
{ "message": "method.not.allowed", "code": 0, "info": "…", "status": 405 }
```

Triggered by `?info=true`: `ProcessGetAssignedProAPICommand.readResourceView` unconditionally throws `ProAPIMethodNotImplemented("method.not.allowed")`. Also returned by JAX-RS for any non-`GET` verb.

Same trap as #2 — the client correctly omits `info` (`supervisorApis.ts:151`), and adding `info=true` would turn a working call into a hard `405`.

## 500 — Internal Server Error (uncaught)

**Not thrown deliberately** — an uncaught `NullPointerException` escaping the command. `ccConfigService.getProcessUserById(...)` returns `null`, and the result is then dereferenced by `processuser.getProcessId()`.

Because nothing catches it, the body is whatever the servlet container renders for an unhandled exception, **not** `RESTAPIErrorResponseEntity`. Consumers must not assume the standard envelope on this state — it may be an HTML error page rather than JSON.

This is the one state on this endpoint that indicates a genuine bug rather than a handled condition. Contrast with `512`, where the same underlying `getProcessUserById` failing loudly (a `ServiceInvocationException`) is caught and wrapped properly; only the silent `null` return slips through.

## 512 — Internal Server Error

Thrown by `RESTInternalServerException`. Non-standard code, outside the IANA registry.

```json
{ "message": "user.not.found", "code": 0, "info": "…", "status": 512 }
```

Raised by any `ProAPICommandExecutionException`:

- `getContactCenterIdForSession` fails
- `PrivilegeProcessingException`
- CC-user fetch fails
- CC user is `null` → `user.not.found`
- `processUserIds` is `null` → `user.not.assigned.to.any.campaign`
- `getProcessUserById` or `getProcessById` throws a `ServiceInvocationException`

As in #2, an authenticated supervisor with no assignments gets `user.not.assigned.to.any.campaign` as a `512` rather than an empty `200`, so the process selector fails to load instead of showing "none".

## How the client handles all of the above

`fetchAssignedProcesses` (`src/features/process/asyncActions.ts:82`) catches every `AxiosError` identically and rejects with the normalised error; the non-axios fallback message is `"Failed to load assigned processes"`. All six error states, plus the uncaught `500`, produce the same empty process selector. Nothing reads `message`, `code`, or `info`.

This call runs at session bootstrap (`useSessionBootstrap.ts:20`) as well as on the interactions page, so a `512` here degrades more than one surface.

---

# 4. Campaign queues

`GET /cms/configuration/hierarchyconfig/campaign/{campaignId}/getAllAgentQueueDetailedByCampaign`
Spec: `cms-apis-swagger.json` → `getAllAgentQueueDetailedByCampaign`

## 200 — List of Agent Queues in Campaign Returned

Schema: `QueueDetailBean[]` (`application/json`)

A bare JSON array. Unlike most CMS endpoints this one is **not** wrapped in the `CommonResponse` envelope, so there is no `http_code` field inside the payload to inspect.

```json
[
  {
    "queueId": 0,
    "queueName": "string",
    "campaignId": 0,
    "campaignName": "string",
    "queuePriority": 0,
    "resourceSchedulerType": "string",
    "requestQueueType": "string",
    "description": "string",
    "transferable": true,
    "skillIds": [0],
    "userIdList": [0],
    "dateAdded": "2026-09-02T10:00:00Z"
  }
]
```

An empty array is a valid `200` and is indistinguishable in the UI from any error state below — all render as an empty Queue filter.

## 400 — Bad Request

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 400, "status": "Bad Request", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

Non-numeric `campaignId`. Queue filter stays empty.

## 401 — Unauthorized

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 401, "status": "Unauthorized", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

Interceptor refreshes and retries once.

## 403 — Forbidden

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 403, "status": "Forbidden", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

No rights on the campaign. Queue filter stays empty.

## 404 — Not Found

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 404, "status": "Not Found", "errorCode": "CONF-1001", "errorMessage": "Object doesn't exist" }
```

Unknown `campaignId`. Queue filter stays empty.

## 500 — Internal Server Error

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 500, "status": "Internal Server Error", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

Queue filter stays empty.

---

# 5. Campaign disposition codes

`GET /ameyorestapi/cc/dispositionCodes/getByCampaign?campaignId={campaignId}&info=false`

Not in either swagger file — states below are from the Ameyo appserver implementation.

The widest state set of any API here: **eight**. It is the only Ameyo endpoint documented so far that emits a `400`, and like #3 it carries both a handled `512` and a bare uncaught `500`.

## 200 — OK

`Response.Status.OK`. Body is a JSON array of `DispositionCodeProAPIOutputBean`. An empty array is still a `200`.

```json
[
  { "dispositionCodeId": 41, "dispositionCodeName": "Interested", "dispositionClassId": 7 }
]
```

Only three fields. The bean deliberately drops the rest of `IDispositionCode`, and the command carries a standing `// TODO: Custom code=, need to generate rest stub for extra output params` noting it.

That matters for the Disposition filter: there is no disposition **class name** in this payload, only `dispositionClassId`. Grouping codes under readable class headings would need either that TODO resolved or a second call to `getDispositionClassesWithDispositionCodesNameOfCampaign`, which is already wrapped at `supervisorApis.ts:232` but unused.

## Error envelope — `RESTAPIErrorResponseEntity`

The `400`, `401`, `403`, `404`, `405`, and `512` states all return the shared shape:

```json
{
  "message": "InvalidInput",
  "code": 40001,
  "info": "parameter expected in input: campaignId",
  "status": 400
}
```

The uncaught `500` does not — see below.

## 400 — Bad Request

Thrown by `RESTBadRequestException` when `campaignId` is missing or blank.

```json
{ "message": "InvalidInput", "code": 40001, "info": "parameter expected in input: campaignId", "status": 400 }
```

Unreachable from the Interaction Details page as written. The effect at `InteractionDetailsPage.tsx:471` returns early when `campaignId === null`, so the thunk never fires without one, and `buildQuery` (`supervisorApis.ts:108`) would drop the parameter entirely rather than send a blank. Reachable only if a caller passes `NaN`, which serialises to the string `"NaN"`.

## 401 — Unauthorized

Thrown by `RESTAuthenticationException`.

```json
{ "message": "invalid.authentication.token", "code": 909090, "info": "…", "status": 401 }
```

The auth filter rejects the token — **only when `secure.mode=true`** — or `GetDispositionCodesForCampaignPrivilegeHelper` throws an `AuthenticationException`. Intercepted and retried once by `apiClient/index.ts:72`.

## 403 — Forbidden

Thrown by `RESTAuthorizationException` when `GetDispositionCodesForCampaignPrivilegeHelper` raises a `PrivilegeException` — the caller lacks rights on that specific campaign.

```json
{ "message": "…", "code": 0, "info": "…", "status": 403 }
```

**The most likely real-world error on this endpoint.** Because the privilege check is per-campaign, a supervisor can load the page successfully and then hit `403` simply by switching to a campaign they don't own. The UI shows this as an empty Disposition filter, indistinguishable from a campaign that genuinely has no disposition codes.

## 404 — Not Found

Thrown by `RESTResourceNotFoundException`.

```json
{ "message": "requested.resource.not.found", "code": 99999, "info": "…", "status": 404 }
```

The source notes **two distinct causes** for this state, but the detail was not supplied — **cause breakdown not found**. Unlike #2 and #3, where `404` is effectively unreachable, this one is described as having real triggers, so it should be treated as a live state until the two causes are confirmed.

## 405 — Method Not Allowed

Thrown by `RESTMethodNotAllowedException`.

```json
{ "message": "method.not.allowed", "code": 0, "info": "…", "status": 405 }
```

Triggered by `?info=true`: `readResourceView` unconditionally throws `ProAPIMethodNotImplemented("method.not.allowed")`, exactly as in #2 and #3. Also returned by JAX-RS for non-`GET` verbs.

The client's explicit `info=false` (`supervisorApis.ts:219`) avoids it. Worth keeping: the `info` parameter is a plausible-looking route to the richer disposition data the `200` bean omits, and it is a hard `405` on every Ameyo endpoint documented so far.

## 500 — Internal Server Error (uncaught)

**Not thrown deliberately** — an uncaught `NullPointerException`. `getDispositionCodesForCampaign` returns `null` and the for-each loop then dereferences it.

As with #3, nothing catches this, so the body is whatever the servlet container renders and **not** `RESTAPIErrorResponseEntity`. It may be an HTML error page rather than JSON.

Note the split with `512` below: the same `getDispositionCodesForCampaign` call failing loudly is caught and wrapped, while a silent `null` return escapes. This is the same null-versus-throw asymmetry as #3.

## 512 — Internal Server Error

Thrown by `RESTInternalServerException`. Non-standard code.

```json
{ "message": "…", "code": 0, "info": "…", "status": 512 }
```

Raised by a `DispositionException` or `ServiceInvocationException` from `IDispositionManager.getDispositionCodesForCampaign`, or by a `PrivilegeProcessingException`.

## How the client handles all of the above

`fetchCampaignDispositions` (`asyncActions.ts:233`) rejects with the generic fallback `"Failed to load dispositions"`, and the effect at `InteractionDetailsPage.tsx:478` catches everything and sets `setDispositions([])`. All eight states below `200` — including the per-campaign `403`, which is the common one — collapse into an empty Disposition filter with no message.

---

# 6. Campaign users

`GET /cms/configuration/cc/{contactCenterId}/process/{processId}/campaign/{campaignId}/campaign-user?limit=1000`
Spec: `cms-apis-swagger.json` → `getAllCampaignUsersInCampaign_1`

## 200 — List of Process Users in Process Returned

Schema: `CommonResponseListCampaignUserResponseCustomOffsetMetadata` (`application/json`)

```json
{
  "http_code": 200,
  "method": "GET",
  "request_id": "6da10c2e-1ef7-4206-98ce-410087c9a151",
  "response": [ { "...CampaignUserResponse" } ],
  "metadata": { "total": "1", "count": 1, "offset": 1, "limit": 1 }
}
```

This endpoint uses **offset** pagination (`CustomOffsetMetadata`), not the cursor pagination of the interaction list. `metadata.total` is a string here too. The client requests `limit=1000` and does not page, so a campaign with more than 1000 users is silently truncated — a success state that reads as complete data.

## 400 — Bad Request

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 400, "status": "Bad Request", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

Bad `limit`, `offset`, or `sortBy`. User filter stays empty.

## 401 — Unauthorized

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 401, "status": "Unauthorized", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

Interceptor refreshes and retries once.

## 403 — Forbidden

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 403, "status": "Forbidden", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

No rights on the contact centre, process, or campaign. User filter stays empty.

## 404 — Not Found

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 404, "status": "Not Found", "errorCode": "CONF-1001", "errorMessage": "Object doesn't exist" }
```

Unknown contact centre, process, or campaign id. User filter stays empty.

## 500 — Internal Server Error

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 500, "status": "Internal Server Error", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

User filter stays empty.

---

# 7. Interaction timeline

`GET {interactionServerOrigin}/interaction-svc/api/v1/cc-list/{ccId}/process-list/{processId}/interactions/{interactionId}/interaction-timeline`

Not in either swagger file — states below are from the interaction-svc implementation.

This is the **third error envelope** in the system, unrelated to `ExceptionBody` (data-engine, CMS) and `RESTAPIErrorResponseEntity` (Ameyo). It is also the most granular: eight HTTP codes carrying **eleven distinct `error_code` values**, so the `error_code` — not the HTTP status — is the field that actually identifies what went wrong. Four separate causes hide behind `404` alone.

## 200 — OK

`data` is an array of `InteractionActivityOutputBean`, serialized **snake_case** with `@JsonInclude(NON_EMPTY)` on every field, so absent values are omitted entirely rather than sent as `null`.

```json
{
  "http_code": 200,
  "method": "POST",
  "request_id": "6da10c2e-1ef7-4206-98ce-410087c9a151",
  "response": {
    "http_code": 200,
    "error_data": null,
    "data": [
      {
        "interaction_id": "300366e3-eafb-4b39-acd2-2620c22305",
        "event_name": "CONNECTED",
        "event_time": 1681715000570,
        "event_init_time": 1681715330570,
        "media_id": "d576-643672f4-vcall-0",
        "queue_name": "Hindi",
        "user_name": "Shyam",
        "customer_name": "Nita",
        "user_disposition": "CONNECTED",
        "campaign_name": "Outbound"
      }
    ]
  }
}
```

Two things to code against here.

`"method": "POST"` **is wrong, and always will be.** The controller hardcodes `RequestMethod.POST.toString()` on this `GET` endpoint, so every successful response mislabels its own verb. Error responses go through the exception advice, which uses `request.getMethod()` and correctly reports `GET`. Anything keying off `method` will see it flip between success and failure on the same request.

`NON_EMPTY` means **every field is optional at runtime**. An event with no queue simply has no `queue_name` key rather than `"queue_name": null`, so consumers must use presence checks rather than null checks. This also differs from the interaction-list payload, which is camelCase.

### Silent failures also return 200

The source notes that `200` covers "most silent failures" as well as genuine success, but the breakdown was not supplied — **silent-failure cases not found**. Treat a `200` with an empty or short `data` array as ambiguous until those are documented.

## Error envelope

All error states share this shape, with `data: null` and `error_data` populated:

```json
{
  "http_code": 404,
  "method": "GET",
  "request_id": "…",
  "response": {
    "http_code": 404,
    "error_data": {
      "error_code": "CONF-1001",
      "message": "cc.not.found",
      "description": "Not Found"
    },
    "data": null
  }
}
```

`message` carries the **raw i18n key**, not a resolved string — rendering it directly would put `cc.not.found` in front of a user. `description` is only the HTTP reason phrase, so it adds nothing beyond the status. The one field with real diagnostic value is `error_code`.

**Beware a code collision:** `CONF-1001` here means `CC_NOT_FOUND`, while `CONF-1001` in the data-engine and CMS `ExceptionBody` schema is the generic `"Object doesn't exist"`. The same string means different things depending on which service answered, so `error_code` is only meaningful together with its origin.

## 400 — Bad Request

Two `error_code` values:

| `error_code` | Trigger |
| --- | --- |
| `IS-1001` | `ConstraintViolationException` from bean validation |
| `IS-1003` | Non-numeric `ccId` or `processId` in the path (`MethodArgumentTypeMismatchException` via `handleExceptionInternal`) |

```json
{ "http_code": 400, "method": "GET", "request_id": "…", "response": { "http_code": 400, "error_data": { "error_code": "IS-1003", "message": "…", "description": "Bad Request" }, "data": null } }
```

`IS-1003` is unreachable from this page — `ccId` and `processId` are numbers in `interactionApis.ts:43`.

## 401 — Unauthorized

`error_code`: `AUTH-1001`. Missing, malformed, or expired Bearer token. `CustomAuthenticationEntryPoint` funnels the `AuthenticationException` into the same handler so the body stays consistent with every other error.

```json
{ "http_code": 401, "method": "GET", "request_id": "…", "response": { "http_code": 401, "error_data": { "error_code": "AUTH-1001", "message": "…", "description": "Unauthorized" }, "data": null } }
```

Intercepted by `apiClient/index.ts:72`, which refreshes single-flight and retries once.

## 403 — Forbidden

`error_code`: `AUTH-1002`. An `AccessDeniedException` from either the chain-level `anyRequest().hasAnyRole(...)` or the method-level `@PreAuthorize` check for `VIEW_INTERACTION` on that `processId`.

```json
{ "http_code": 403, "method": "GET", "request_id": "…", "response": { "http_code": 403, "error_data": { "error_code": "AUTH-1002", "message": "…", "description": "Forbidden" }, "data": null } }
```

Like #5's `403`, this is **per-process**, so a supervisor can open one interaction fine and be denied on the next.

## 404 — Not Found

The busiest state: four distinct causes, separable only by `error_code`.

| `error_code` | Constant | Trigger |
| --- | --- | --- |
| `CONF-1001` | `CC_NOT_FOUND` | `ccId` not in the CMS config cache |
| `CONF-1002` | `PROCESS_NOT_FOUND` | `processId` not in the config cache |
| `INTERACTION-1001` | `INTERACTION_NOT_FOUND` | The interaction doesn't exist |
| `INTERACTION-1007` | `INTERACTION_TIMELINE_NOT_FOUND` | Jackson fails parsing the stored timeline JSON for a closed interaction |

```json
{ "http_code": 404, "method": "GET", "request_id": "…", "response": { "http_code": 404, "error_data": { "error_code": "INTERACTION-1007", "message": "…", "description": "Not Found" }, "data": null } }
```

These four want different responses. The two `CONF-*` codes are configuration faults affecting every interaction in that scope. `INTERACTION-1001` means the row is genuinely gone. `INTERACTION-1007` is a **data-corruption signal** — the interaction and its timeline both exist, but the stored JSON won't parse, so retrying will never help. Collapsing all four into one retryable error, as the UI does today, is least appropriate for that last one.

## 405 / 406 — Method Not Allowed / Not Acceptable

Both carry `error_code` `IS-1003`. `405` for the wrong HTTP verb, `406` for an `Accept` header incompatible with `application/json`.

```json
{ "http_code": 406, "method": "GET", "request_id": "…", "response": { "http_code": 406, "error_data": { "error_code": "IS-1003", "message": "…", "description": "Not Acceptable" }, "data": null } }
```

Not reachable as the client is written: the shared axios instance sets `Accept: application/json` by default (`apiClient/index.ts:15`) and the call is a `GET`.

## 500 — Internal Server Error

Two `error_code` values, and the distinction matters:

| `error_code` | Constant | Trigger |
| --- | --- | --- |
| `INTERACTION-1006` | `APPSERVER_TIMELINE_NOT_FOUND` | The appserver returned a null or empty timeline — for an OPEN interaction, or a CLOSED one not yet dumped to the timeline table |
| `IS-1002` | — | Generic fallback for any other unhandled exception reaching the advice |

```json
{ "http_code": 500, "method": "GET", "request_id": "…", "response": { "http_code": 500, "error_data": { "error_code": "INTERACTION-1006", "message": "…", "description": "Internal Server Error" }, "data": null } }
```

`INTERACTION-1006` is **not really a server fault**. An interaction that is still open, or closed so recently that the dump job hasn't run, is an expected timing condition — yet it surfaces as a `500`. This is the timeline's counterpart to the Ameyo `user.not.assigned.to.any.campaign` returning `512`: a benign, explainable state dressed as a server error. It is also the single most likely error a supervisor will hit, since opening the panel on a live or just-ended interaction is normal behaviour.

Unlike a genuine `IS-1002`, retrying `INTERACTION-1006` is reasonable — the dump may land shortly.

## How the client handles all of the above

`interactionApis.getInteractionTimeline` types the response as `unknown` (`interactionApis.ts:47`), so none of this structure is modelled. `InteractionTimeline.tsx:98` collapses all eleven `error_code` values, all eight HTTP codes, plus network and DNS failures against the separate `interaction.server.domain` host, into one retryable error state.

The envelope is unusually informative and none of it is read. The cheapest improvement available anywhere in this document is to surface `response.error_data.error_code` here: it would separate "this interaction is still open, try again shortly" (`INTERACTION-1006`) from "you lack permission on this process" (`AUTH-1002`) and from "the stored timeline is corrupt, retrying is pointless" (`INTERACTION-1007`).

---

# 8. All contact-center users

`GET /ameyorestapi/cc/contactCenterUsers/getAllContactCenterUsers`

Not in either swagger file — states below are from the Ameyo appserver implementation.

Seven states, matching #3's shape: the common Ameyo core plus a bare uncaught `500`.

## 200 — OK

`Response.Status.OK`. Body is a JSON array of `ContactCenterUserProAPICustomOutputBean`. An empty array is still a `200`.

```json
[
  {
    "ccUserId": 118,
    "userId": "agent01",
    "userType": "Agent",
    "userName": "Ravi Kumar",
    "systemUserType": "Agent",
    "privilegePlanId": 4,
    "defaultReady": false,
    "maskedPrivileges": ["voice.dial"],
    "skillIds": [3, 7],
    "skillLevelIds": [2, 5],
    "maxAllowedLogins": 1,
    "loginPolicy": "default",
    "mappingUserId": null
  }
]
```

`skillIds` and `skillLevelIds` are two parallel arrays derived from the same `skillLevelIds` map — keys and values respectively. They are **positionally related, not independent lists**: `skillIds[i]` pairs with `skillLevelIds[i]`. Sorting or filtering one without the other silently corrupts the mapping.

The client's `ContactCenterUser` interface (`supervisorApis.ts:51`) models only four of these thirteen fields — `userId`, `userName`, `userType`, `systemUserType` — which is all the hover card needs. The rest are received and discarded.

Note this is an **unscoped, uncached-on-the-server bulk fetch**: every contact-centre user in one response, requested to resolve a single `userId` to a name. The client caches it in memory under one key (`useUserHoverCard.ts:15`), so it is fetched at most once per session, but on a large tenant the first hover card pays for the whole directory.

## Error envelope — `RESTAPIErrorResponseEntity`

The `401`, `403`, `404`, `405`, and `512` states share the standard Ameyo shape:

```json
{ "message": null, "code": 99999, "info": "invalid session id", "status": 403 }
```

The uncaught `500` does not — see below.

## 401 — Unauthorized

Thrown by `RESTAuthenticationException`.

```json
{ "message": "invalid.authentication.token", "code": 909090, "info": "…", "status": 401 }
```

The auth filter rejects the token — **only when `secure.mode=true`** — or `GetAllAssignedUsersForContactCenterPrivilegeHelper` throws an `AuthenticationException`. Intercepted and retried once by `apiClient/index.ts:72`.

## 403 — Forbidden

Thrown by `RESTAuthorizationException`.

```json
{ "message": null, "code": 99999, "info": "invalid.session.id", "status": 403 }
```

Triggered when `IProAPISessionHelper.getSessionIdForAuthToken` returns `null`, or by a `PrivilegeException` from the privilege helper for that contact centre.

Same inverted field usage as #3's `403`: `message` is `null` and the machine-readable key sits in `info`. Note this endpoint takes no explicit `sessionId` query parameter (`supervisorApis.ts:262`) and relies entirely on the auth token, so the null-session branch is the more likely of the two triggers.

## 404 — Not Found

Thrown by `RESTResourceNotFoundException`.

```json
{ "message": "requested.resource.not.found", "code": 99999, "info": "…", "status": 404 }
```

Two paths. The `responseBean == null` branch is unreachable — the command always returns a `LinkedList`. The reachable one is a **non-numeric `?ccId=abc`**: JAX-RS maps `@QueryParam` conversion failures to `404` per spec, not to `400`.

That second path is a genuine trap, because a type error in a query parameter producing "not found" reads as missing data rather than a malformed request. The current client never sends `ccId` (`supervisorApis.ts:262` passes only `info`), so it is not reachable today.

## 405 — Method Not Allowed

Thrown by `RESTMethodNotAllowedException`.

```json
{ "message": "method.not.allowed", "code": 0, "info": "…", "status": 405 }
```

Triggered by `?info=true`: `readResourceView` unconditionally throws `ProAPIMethodNotImplemented("method.not.allowed")`. Also non-`GET` verbs.

**The closest call in this document.** Unlike #2 and #3, the client wrapper here actually exposes the parameter — `getAllContactCenterUsers(info?: boolean)` (`supervisorApis.ts:262`) — so passing `true` is a one-word change. It is safe today only because the sole caller invokes it with no arguments (`useUserHoverCard.ts:16`), leaving `info` undefined for `buildQuery` to drop. The parameter should probably be removed from the signature rather than left as a loaded footgun.

## 500 — Internal Server Error (uncaught)

**Not thrown deliberately** — an uncaught `NullPointerException`, from either of two causes:

- `getAllAssignedUsersForContactCenter` returns `null`, and the for-each dereferences it
- **any single user's `getSkillLevelIds()` is `null`**

The second is the dangerous one. One misconfigured user anywhere in the contact centre takes down the entire directory fetch, so every hover card across the whole page fails on account of a record unrelated to the user being hovered. Nothing degrades gracefully, and the failure is indistinguishable from an auth or server problem.

As with #3 and #5, nothing catches this, so the body is whatever the servlet container renders and **not** `RESTAPIErrorResponseEntity` — possibly HTML.

## 512 — Internal Server Error

Thrown by `RESTInternalServerException`. Non-standard code.

```json
{ "message": "…", "code": 0, "info": "…", "status": 512 }
```

Raised by a `ProAPIHelperException` resolving the contact centre from the session, a `PrivilegeProcessingException`, a `ContactCenterConfigurationException` or `ServiceInvocationException` from `getAllAssignedUsersForContactCenter`, or a `ServiceInvocationException`/`UserConfigurationException` from `getAllUsers`.

## How the client handles all of the above

Better than most surfaces in this document, though still code-blind. Every state below `200` lands in the `catch` at `useUserHoverCard.ts:73`, which renders the hover card with the raw `userId` as subtitle and a `hoverCardLoadError` footer — an actual error message, unlike the silent empty dropdowns elsewhere.

Two behaviours worth knowing:

**Failures are not negatively cached.** `loadCached` deletes the entry on rejection (`hoverCardCache.ts:28`), so closing and reopening the hover card retries. A transient `512` self-heals on the next hover.

**This call is bundled with #9 under `Promise.all`** (`useUserHoverCard.ts:52`). Either endpoint failing rejects both, so a `512` here discards successfully-fetched campaign data, and a failure in #9 discards the user directory. Neither partial result is shown.

---

# 9. Campaigns assigned by user

`GET /ameyorestapi/cc/hybrid/campaigns/getAssignedByUserId?userId={userId}`

Not in either swagger file — states below are from the Ameyo appserver implementation.

Seven states, matching #3 and #8. Returns the same bean as #2 but populates it differently, and routes bad input through `512` rather than `400`.

## 200 — OK

`Response.Status.OK`. Body is a JSON array of `CampaignProAPIOutputBean`.

```json
[
  {
    "campaignId": 12,
    "campaignName": "Outbound Sales",
    "campaignType": "InteractiveVoiceApplication",
    "description": "…",
    "processId": null,
    "contactCenterId": null
  }
]
```

**Same bean as #2, different population.** This command never sets `processId` or `contactCenterId`; both come back `null`, whereas `campaigns/getAssigned` populates both. Anyone treating the two endpoints as interchangeable because they share an output class will get silent nulls.

That already reaches the client. `toAssignedCampaigns` (`hoverCardPayload.ts:121`) is the converter used for this endpoint and it maps both fields (`hoverCardPayload.ts:131-132`), so `processId` and `contactCenterId` are always `undefined` on the result. Harmless today — the hover card reads only `campaignId` and `campaignName` (`useUserHoverCard.ts:65-68`) — but the converter's shape promises data this endpoint cannot supply.

An **empty array is still a `200`**, and it has a specific meaning: the user has process assignments but no campaign-context assignments. Contrast with a user who has no process assignments at all, which is a `512` — see below.

## Error envelope — `RESTAPIErrorResponseEntity`

The `401`, `403`, `404`, `405`, and `512` states share the standard Ameyo shape:

```json
{ "message": "", "code": 99999, "info": "user not found", "status": 512 }
```

Note `message` is an empty string here where #3 and #8 send `null` for the same field on their `403`. It is unreliable across states and endpoints; treat it as optional. The uncaught `500` uses no envelope at all.

## 401 — Unauthorized

Thrown by `RESTAuthenticationException`.

```json
{ "message": "invalid.authentication.token", "code": 909090, "info": "…", "status": 401 }
```

The auth filter rejects the token — **only when `secure.mode=true`** — or `GetContactCenterByIdPrivilegeHelper` throws an `AuthenticationException`. Intercepted and retried once by `apiClient/index.ts:72`.

## 403 — Forbidden

Thrown by `RESTAuthorizationException`.

```json
{ "message": null, "code": 99999, "info": "invalid.session.id", "status": 403 }
```

No resolvable session, or a `PrivilegeException` from the privilege helper. Same inverted field usage as #3 and #8 — the machine-readable key sits in `info`, not `message`.

## 404 — Not Found

Thrown by `RESTResourceNotFoundException` when `responseBean == null`. Unreachable — the command always returns a list.

```json
{ "message": "requested.resource.not.found", "code": 99999, "info": "…", "status": 404 }
```

## 405 — Method Not Allowed

Thrown by `RESTMethodNotAllowedException`.

```json
{ "message": "method.not.allowed", "code": 0, "info": "…", "status": 405 }
```

`?info=true` makes `readResourceView` unconditionally throw `ProAPIMethodNotImplemented`. Also non-`GET` verbs. The client omits `info` entirely here (`supervisorApis.ts:285`), so unlike #8 the parameter is not even exposed.

## 500 — Internal Server Error (uncaught)

**Not thrown deliberately** — an uncaught `NullPointerException`. `getCampaignContextById` returns `null`, then `campaign.getCampaignContextId()` dereferences it.

Body is whatever the servlet container renders, **not** `RESTAPIErrorResponseEntity` — possibly HTML. Same null-versus-throw asymmetry as #3, #5, and #8: a config lookup failing loudly is wrapped as `512`, a silent `null` escapes as `500`.

## 512 — Internal Server Error

Thrown by `RESTInternalServerException`. Non-standard code.

```json
{ "message": "", "code": 99999, "info": "user not found", "status": 512 }
```

Triggers:

- `userId` missing, empty, or unknown → `user.not.found`
- user has no process assignments → `user.not.assigned.to.any.campaign`
- `ProAPIHelperException` resolving the contact centre from the session
- `PrivilegeProcessingException`
- `ContactCenterConfigurationException` or `ServiceInvocationException` from any config lookup

**Bad input returns `512`, not `400`.** A missing, empty, or unknown `userId` — an ordinary client mistake — is reported as a server error. This endpoint has no `400` at all, so there is no status that distinguishes "you sent something wrong" from "the server broke".

The distinction between the two assignment states is subtle and inverted from what you would expect: a user with **no process assignments** gets `512`, while a user with processes but **no campaign contexts** gets an empty `200`. Two similar-sounding "this user has nothing" conditions, one an error and one a success.

## How the client handles all of the above

Every state below `200` rejects into the shared `catch` at `useUserHoverCard.ts:73`, rendering the hover card with the raw `userId` and a `hoverCardLoadError` footer.

The `512`-for-`user.not.found` case is the notable one: hovering an agent whose id has since been removed shows a load error rather than "user no longer exists", because nothing reads `info`.

As noted in #8, this call is bundled with the user-directory fetch under `Promise.all` (`useUserHoverCard.ts:52`), so a `512` here also discards the successfully-fetched directory. Failures are not negatively cached (`hoverCardCache.ts:28`), so reopening the card retries.

---

# 10. Customer info

`GET /ameyorestapi/cc/getCustomerInfosForCustomerId?campaignId={campaignId}&customerId={customerId}`

Not in either swagger file — states below are from the Ameyo appserver implementation.

**The outlier of the Ameyo set.** Six reachable states, and it is the only one here with no `512` and no privilege check at all. My earlier prediction that an unknown `customerId` would be a `512` was wrong: it is a `404`.

## 200 — OK

A **single object**, not an array — the only Ameyo endpoint here that doesn't return a list.

```json
{
  "campaignId": 12,
  "customerId": 98765,
  "name": "Nita Sharma",
  "phones": ["98XXXXXX53"],
  "lastDialedNum": "…",
  "lastStatus": "CONNECTED",
  "lastDisposition": "Interested",
  "lastCallType": "outbound",
  "numAttempts": 3,
  "dateModified": "2026-08-30T11:22:33Z",
  "lastChurnDate": null,
  "isExcludedDisposed": false,
  "isCallbackScheduled": false,
  "timeZone": null,
  "lastAttemptedUserDisposition": null,
  "customerInfo": {
    "customerId": 98765,
    "leadId": 4,
    "processId": 3,
    "customerFields": [
      { "fieldName": "phone1", "value": "…", "maskable": true, "maskedValue": "…", "uniqueIdentifier": "…" }
    ],
    "customerData": { },
    "extraData": { },
    "numInboundAttempted": 1,
    "numInboundConnected": 1,
    "numOutboundAttempted": 2,
    "numOutboundConnected": 1
  }
}
```

`timeZone` and `lastAttemptedUserDisposition` are declared on the bean but never populated by this command — always `null`.

`toCustomerHoverInfo` (`hoverCardPayload.ts:74`) reads `name`, `customerId`, `phones[0]`, and digs into `customerInfo.customerData`, `customerInfo.extraData`, and `customerInfo.customerFields` for first/last name, email, and two phone numbers. Everything else is discarded.

### The client prefers `value` over `maskedValue`

Each entry in `customerFields` carries `maskable`, a raw `value`, and a `maskedValue`. The client's field reader ignores `maskable` entirely and resolves `record?.value ?? record?.maskedValue` (`hoverCardPayload.ts:69`) — so **the unmasked value wins whenever it is present**, and the masked one is used only as a fallback.

Whether that leaks anything depends on server behaviour this description doesn't cover: if the appserver blanks `value` for maskable fields, the fallback is correct and the masked form is shown. If it populates both, the hover card renders unmasked customer phone numbers and emails regardless of the masking flag. **Worth confirming against a live response before relying on masking here.** Note the top-level `phones[0]` is already masked in the example (`98XXXXXX53`), which suggests masking is expected on this surface.

## Error envelope — `RESTAPIErrorResponseEntity`

The `400`, `401`, `404`, and `405` states share the standard Ameyo shape:

```json
{ "message": "InvalidInput", "code": 40001, "info": "parameter expected in input: customerId", "status": 400 }
```

The uncaught `500` does not.

## 400 — Bad Request

Thrown by `RESTBadRequestException` when `campaignId` or `customerId` is missing or blank. `info` names the offending parameter.

```json
{ "message": "InvalidInput", "code": 40001, "info": "parameter expected in input: customerId", "status": 400 }
```

Unreachable from the hover card: `useCustomerHoverCard.ts:59` returns early unless both `customerId` and `campaignId` are present.

This is the second endpoint with a `400` (after #5), and both of them are ones the client already guards.

## 401 — Unauthorized

Thrown by `RESTAuthenticationException`, and **only** by `RestAuthenticationRequestFilter` when `secure.mode=true`. Unlike every other Ameyo endpoint here, the command itself never throws `ProAPIAuthenticationException` — there is no second path.

```json
{ "message": "invalid.authentication.token", "code": 909090, "info": "…", "status": 401 }
```

Intercepted and retried once by `apiClient/index.ts:72`.

## 404 — Not Found

Thrown by `RESTResourceNotFoundException`. The most overloaded state on this endpoint, covering three unrelated situations:

- the customer genuinely does not exist
- **every backend failure** — with no `512` on this command, infrastructure faults surface here too
- non-numeric `campaignId` or `customerId`, via the JAX-RS `@QueryParam` conversion rule

```json
{ "message": "requested.resource.not.found", "code": 99999, "info": "…", "status": 404 }
```

The middle case is the significant one: on every other Ameyo endpoint a backend fault is a loud `512`, but here it is indistinguishable from "no such customer". A database outage and a stale customer id produce the same response. The source notes this behaviour but the breakdown of which backend failures map here was not supplied — **backend-failure list not found**.

## 405 — Method Not Allowed

From JAX-RS, for a wrong HTTP verb only.

```json
{ "message": "method.not.allowed", "code": 0, "info": "…", "status": 405 }
```

**No `info=true` trap.** This command has no `readResourceView` override and takes no `info` parameter, making it the one Ameyo endpoint here where that footgun doesn't exist.

## 500 — Internal Server Error (uncaught)

**Not thrown deliberately** — an uncaught `NullPointerException`, from either:

- `customerInfo.getCustomerInfo()` returns `null`, then `customerBean.getCustomerFields()` dereferences it
- `adaptCustomerField` iterates a null field list

Body is whatever the servlet container renders, **not** `RESTAPIErrorResponseEntity` — possibly HTML. With no `512` on this command, this bare `500` is the only state that signals a server-side defect, and it signals it by accident.

## 403 — unreachable

No `authenticateAndAuthorize` call exists anywhere in this command, so `RESTAuthorizationException` is never thrown.

**This is the finding worth escalating.** Every sibling endpoint runs a privilege helper — #2 and #3 check contact-centre access, #5 checks per-campaign rights, #8 checks the contact centre, #9 checks via the session. This one checks nothing. Any caller holding a valid session token can request **any** `campaignId`/`customerId` pair and receive that customer's PII: name, phone numbers, email, and the full `customerFields` list. There is no campaign-scoping, no ownership check, and — when `secure.mode=false` — not even the `401`.

The client only ever requests the customer on a row the supervisor can already see, so the app does not exploit this. The exposure is at the API, reachable by anyone who can reach the gateway with a session.

## 512 — unreachable

Nothing in this command throws `ProAPICommandExecutionException`, so the `512` that every other Ameyo endpoint uses for server faults is never produced here. Faults land on `404` (handled) or `500` (uncaught) instead.

## How the client handles all of the above

Every state below `200` rejects into the `catch` at `useCustomerHoverCard.ts:76`, rendering the hover card with the customer's display name and a `hoverCardLoadError` footer.

Results are cached per `campaignId:customerId` pair (`useCustomerHoverCard.ts:16`); failures are not negatively cached (`hoverCardCache.ts:28`), so reopening retries. Unlike the user hover card, this call is not bundled under a `Promise.all`, so its failures affect nothing else.

---

# 11. QA denominator (unwired)

`GET /data-engine/cc-list/{ccId}/process-list/{processId}/campaigns/{campaignId}/campaign-qa-parameter`
Spec: `data-engine-apis.swagger.json` → `getAllCampaignQAParameterForCampaign`

Defined at `asyncActions.ts:158` with slice reducers at `interactionsSlice.ts:181-189`, but never dispatched.

## 200 — get All QA Parameter for Selected Campaign Id

Schema: `CommonResponseCustomDataResponseListCampaignQAParameterBeanVoid` (`application/json`)

The envelope nests one level deeper than the interaction list — `response` is a single object, not an array:

```json
{
  "http_code": 200,
  "method": "GET",
  "request_id": "6da10c2e-1ef7-4206-98ce-410087c9a151",
  "response": {
    "http_code": 200,
    "error_data": "Invalid input for parameter",
    "data": [ { "...CampaignQAParameterBean" } ]
  },
  "metadata": null
}
```

`metadata` is untyped (`Void`). The thunk reads `response.data.response?.data?.length` accordingly (`asyncActions.ts:171`). The inner `http_code`/`error_data` pair means this endpoint has the same hidden per-payload error state as the interaction list.

## 400 — Bad Request

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 400, "status": "Bad Request", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

## 401 — Unauthorized

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 401, "status": "Unauthorized", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

## 403 — Forbidden

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 403, "status": "Forbidden", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

## 404 — Not Found

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 404, "status": "Not Found", "errorCode": "CONF-1001", "errorMessage": "Object doesn't exist" }
```

## 500 — Internal Server Error

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 500, "status": "Internal Server Error", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

All five error states resolve to `qaDenominatorLoading = false` with no error stored (`interactionsSlice.ts:188`), so the scoring denominator silently stays absent.

---

# 12. Interaction QA scores (unwired)

`GET /data-engine/api/v1/cc-list/{ccId}/process-list/{processId}/campaigns/{campaignId}/interactions-quality-analysis-scores`
Spec: `data-engine-apis.swagger.json` → `getInteractionQaScores`

Exposed at `dataEngineApis.interactionQaScore` but never called.

## 200 — Interaction QA scores fetched successfully

Schema: `CommonResponseCustomDataResponseInteractionQaScoreResponseBeanVoid` (`application/json`)

```json
{
  "http_code": 200,
  "method": "GET",
  "request_id": "6da10c2e-1ef7-4206-98ce-410087c9a151",
  "response": {
    "http_code": 200,
    "error_data": "Invalid input for parameter",
    "data": { "...InteractionQaScoreResponseBean" }
  },
  "metadata": null
}
```

Same single-object envelope as #11, `metadata` untyped.

## 400 — Bad Request

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 400, "status": "Bad Request", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

## 401 — Unauthorized

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 401, "status": "Unauthorized", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

## 403 — Forbidden

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 403, "status": "Forbidden", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

## 404 — Not Found

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 404, "status": "Not Found", "errorCode": "CONF-1001", "errorMessage": "Object doesn't exist" }
```

The spec path literally begins with `/data-engine/api/v1/...`, and the generated client prepends the `/data-engine` base path on top, producing `/data-engine/data-engine/api/v1/...`. That would yield a gateway `404` rather than this endpoint's own `404`. Unverified against a live server, but worth checking before wiring this up.

## 500 — Internal Server Error

Schema: `ExceptionBody` (`application/json`)

```json
{ "statusCode": 500, "status": "Internal Server Error", "errorCode": "<server-defined>", "errorMessage": "<server-defined>" }
```

---

# 13. CQA quality analysis (unwired)

`GET /cqa/api/v1/accounts/{accountId}/quality-analysis?external_interaction_ids=...`

**API details not found.** No CQA spec exists in the repo.

## Success (code undocumented)

The hand-written interface at `cqaApis.ts:28` expects the following, but this is an assumption in client code rather than a contract:

```json
{
  "items": [
    {
      "externalInteractionId": "string",
      "interactionId": "string",
      "aiScore": 0,
      "aiScoreMax": 0,
      "model": "string",
      "sentiment": "string",
      "summary": "string",
      "updatedAt": "string"
    }
  ]
}
```

## Error states — not documented

None specified.

---

# States below the HTTP layer

These arise on every API above, documented or not, and none of them carry an HTTP status code.

**Timeout.** The axios instance sets `timeout: 30_000` (`apiClient/index.ts:14`). Produces an `AxiosError` with `code: 'ECONNABORTED'` and **no** `response` object, so `normaliseError` yields `response.status === undefined`.

**Network or CORS failure.** Also produces an `AxiosError` with no `response`. Most likely on the timeline call (#7), which may target a different host than the gateway.

**Non-axios throw.** Each thunk's fallback rejection returns `{ isSuccess: false, message: 'Failed to load …' }` with no `response` key at all, so any consumer reading `error.response.status` must guard against `undefined`.

**Session-ended.** When a `401` refresh attempt itself fails, `endExpiredSession` (`apiClient/index.ts:31`) dispatches logout and clears login state. The original error propagates, but the interactions slice has already been reset to `initialState` by the `logout.fulfilled`/`logout.rejected` matcher (`interactionsSlice.ts:193`), so the grid empties rather than showing an error.

# How the client flattens all of this

**`401` rarely reaches feature code.** The response interceptor (`apiClient/index.ts:72`) catches the first `401` on any request with a live session, runs a single-flight token refresh, and retries once with the new bearer token. Login, logout, and refresh calls are excluded. Only a failed refresh propagates.

**Every other code collapses into one state.** `400`, `403`, `404`, `405`, `406`, `500`, and `512` are all handled identically. Thunks catch `AxiosError` and pass it through `normaliseAxiosResponse(error, 'error')`, which preserves `response.status` and the raw `response.data` but sets `message` to the generic axios string (`"Request failed with status code 404"`), not the server's own message. Nothing in the interactions feature reads `errorCode`/`errorMessage` out of `ExceptionBody`, `message`/`code`/`info` out of `RESTAPIErrorResponseEntity`, or `error_data.error_code` out of the interaction-svc envelope, so the detail all three backends provide is fetched, stored, and never shown.

The cost is highest on the Ameyo endpoints, where a benign state and a real fault share a code: `user.not.assigned.to.any.campaign` and a failed contact-centre lookup both arrive as `512` and render as the same empty selector. The flattening does have one accidental benefit — because `response.data` is never parsed, the uncaught `500` on #3 returning HTML instead of JSON causes no additional breakage.
