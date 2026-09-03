/**
 * Timeline fixtures (#7). `InteractionActivityOutputBean` is serialized
 * snake_case with `@JsonInclude(NON_EMPTY)`, so absent values are omitted
 * entirely rather than sent as `null` — the second event below deliberately
 * has no `queue_name` to exercise that.
 */
export function timelineEvent(overrides: Record<string, unknown> = {}) {
  return {
    interaction_id: '300366e3-eafb-4b39-acd2-2620c22305',
    event_name: 'CONNECTED',
    event_time: 1681715000570,
    event_init_time: 1681715330570,
    media_id: 'd576-643672f4-vcall-0',
    queue_name: 'Hindi',
    user_name: 'Shyam',
    customer_name: 'Nita',
    user_disposition: 'CONNECTED',
    campaign_name: 'Outbound',
    ...overrides,
  };
}

/** Drops a key entirely, as `NON_EMPTY` serialization does. */
function omitKey<T extends object, K extends keyof T>(event: T, key: K): Omit<T, K> {
  const copy = { ...event };
  delete copy[key];
  return copy;
}

export function timelineEvents() {
  return [
    timelineEvent({ event_name: 'QUEUED', event_time: 1681714900570 }),
    // Underscored tokens get humanized by `displayEventLabel`; single-word
    // ones like CONNECTED do not. Both shapes are here on purpose.
    timelineEvent({ event_name: 'AGENT_ASSIGNED', event_time: 1681714950570 }),
    // NON_EMPTY in action: no `queue_name` key at all, not `queue_name: null`.
    omitKey(
      timelineEvent({ event_name: 'CONNECTED', event_time: 1681715000570 }),
      'queue_name',
    ),
    timelineEvent({
      event_name: 'DISPOSED',
      event_time: 1681715330570,
      user_disposition: 'Interested',
    }),
  ];
}
