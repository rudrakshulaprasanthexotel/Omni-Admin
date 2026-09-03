import { offsetEnvelope } from '../scenarios/envelopes';

/**
 * Campaign / process / queue / disposition / user / customer fixtures for
 * APIs #2, #3, #4, #5, #6, #8, #9 and #10.
 */

/** #2 `CampaignProAPIOutputBean` — populates `processId` and `contactCenterId`. */
export function assignedCampaigns() {
  return [
    {
      campaignId: 42,
      campaignName: 'Outbound Sales',
      campaignType: 'InteractiveVoiceApplication',
      description: 'Primary outbound campaign',
      processId: 1,
      contactCenterId: 100,
    },
    {
      campaignId: 43,
      campaignName: 'Inbound Support',
      campaignType: 'InboundVoiceCampaign',
      description: 'Support queue',
      processId: 1,
      contactCenterId: 100,
    },
  ];
}

/**
 * #9 returns the *same* bean as #2 but never sets `processId` or
 * `contactCenterId` — both come back `null`. Anyone treating the two endpoints
 * as interchangeable gets silent nulls.
 */
export function userCampaigns() {
  return [
    {
      campaignId: 42,
      campaignName: 'Outbound Sales',
      campaignType: 'InteractiveVoiceApplication',
      description: 'Primary outbound campaign',
      processId: null,
      contactCenterId: null,
    },
  ];
}

/** #3 `ProcessProAPIOutputBean` — note there is no `contactCenterId` field. */
export function assignedProcesses() {
  return [
    {
      processId: 1,
      processName: 'Sales Process',
      description: 'Outbound sales',
      processType: 'InboundProcess',
    },
  ];
}

/** #4 `QueueDetailBean[]` — a bare array, not wrapped in `CommonResponse`. */
export function campaignQueues() {
  return [
    {
      queueId: 5,
      queueName: 'Hindi',
      campaignId: 42,
      campaignName: 'Outbound Sales',
      queuePriority: 1,
      resourceSchedulerType: 'RoundRobin',
      requestQueueType: 'Voice',
      description: 'Hindi speakers',
      transferable: true,
      skillIds: [3],
      userIdList: [118],
      dateAdded: '2026-08-01T10:00:00Z',
    },
    {
      queueId: 6,
      queueName: 'English',
      campaignId: 42,
      queuePriority: 2,
      transferable: false,
      skillIds: [],
      userIdList: [],
    },
  ];
}

/**
 * #5 `DispositionCodeProAPIOutputBean` — only three fields. There is no
 * disposition *class name* in this payload, only `dispositionClassId`.
 */
export function campaignDispositions() {
  return [
    { dispositionCodeId: 41, dispositionCodeName: 'Interested', dispositionClassId: 7 },
    { dispositionCodeId: 42, dispositionCodeName: 'Callback', dispositionClassId: 7 },
  ];
}

/**
 * #6 `CommonResponseListCampaignUserResponseCustomOffsetMetadata`. Offset
 * pagination, and `metadata.total` is a string. The page reads
 * `response[].data`, so each user is wrapped one level deeper than the
 * generated type suggests.
 */
export function campaignUsersEnvelope() {
  return offsetEnvelope(
    [
      { data: { userId: 'agent01', userName: 'Ravi Kumar' } },
      { data: { userId: 'agent02', userName: 'Priya Nair' } },
    ],
    '2',
  );
}

/**
 * #8 `ContactCenterUserProAPICustomOutputBean`. `skillIds` and `skillLevelIds`
 * are positionally paired, not independent lists.
 */
export function contactCenterUsers() {
  return [
    {
      ccUserId: 118,
      userId: 'agent01',
      userType: 'Agent',
      userName: 'Ravi Kumar',
      systemUserType: 'Agent',
      privilegePlanId: 4,
      defaultReady: false,
      maskedPrivileges: ['voice.dial'],
      skillIds: [3, 7],
      skillLevelIds: [2, 5],
      maxAllowedLogins: 1,
      loginPolicy: 'default',
      mappingUserId: null,
    },
    {
      ccUserId: 119,
      userId: 'agent02',
      userType: 'Agent',
      userName: 'Priya Nair',
      systemUserType: 'Agent',
      skillIds: [],
      skillLevelIds: [],
    },
  ];
}

/** #10 — a single object, not an array. The only Ameyo endpoint here that isn't a list. */
export function customerInfo() {
  return {
    campaignId: 42,
    customerId: 98765,
    name: 'Nita Sharma',
    phones: ['98XXXXXX53'],
    lastDialedNum: '98XXXXXX53',
    lastStatus: 'CONNECTED',
    lastDisposition: 'Interested',
    lastCallType: 'outbound',
    numAttempts: 3,
    dateModified: '2026-08-30T11:22:33Z',
    lastChurnDate: null,
    isExcludedDisposed: false,
    isCallbackScheduled: false,
    // Declared on the bean but never populated by this command.
    timeZone: null,
    lastAttemptedUserDisposition: null,
    customerInfo: {
      customerId: 98765,
      leadId: 4,
      processId: 3,
      customerFields: [
        {
          fieldName: 'phone1',
          value: '9812345653',
          maskable: true,
          maskedValue: '98XXXXXX53',
          uniqueIdentifier: 'phone1',
        },
        {
          fieldName: 'email',
          value: 'nita@example.com',
          maskable: false,
          maskedValue: null,
          uniqueIdentifier: 'email',
        },
      ],
      customerData: { first_name: 'Nita', last_name: 'Sharma' },
      extraData: {},
      numInboundAttempted: 1,
      numInboundConnected: 1,
      numOutboundAttempted: 2,
      numOutboundConnected: 1,
    },
  };
}

/** #11 QA parameter rows. The thunk only reads `data.length`. */
export function qaParameters() {
  return [
    { campaignQaParameterId: 1, parameterName: 'Greeting', maxScore: 15 },
    { campaignQaParameterId: 2, parameterName: 'Resolution', maxScore: 30 },
  ];
}
