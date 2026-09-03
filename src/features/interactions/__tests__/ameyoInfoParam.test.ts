import { describe, expect, it } from 'vitest';
import { supervisorApis } from '@/services/apiClient/supervisorApis';
import { paramsOf } from '@/test/msw/requestLog';
import { TEST_CAMPAIGN_ID } from '@/test/fixtures/auth';
import { createConnectedStore } from '@/test/testStore';

/**
 * Four Ameyo endpoints throw a hard `405` on `?info=true` — the parameter
 * looks like a route to richer data and is a guaranteed failure instead. The
 * only thing standing between the page and that 405 is what the client sends,
 * so that is what is asserted here.
 *
 * The `405` responses themselves are covered by the state table; this locks in
 * the protection.
 */
describe('the ?info=true trap on the Ameyo endpoints', () => {
  it('#2 assigned campaigns omits info entirely', async () => {
    createConnectedStore();
    await supervisorApis.getAssignedCampaigns('sess-test-1');
    expect(paramsOf('assignedCampaigns')).not.toHaveProperty('info');
  });

  it('#3 assigned processes omits info entirely', async () => {
    createConnectedStore();
    await supervisorApis.getAssignedProcesses('sess-test-1');
    expect(paramsOf('assignedProcesses')).not.toHaveProperty('info');
  });

  it('#5 disposition codes sends info=false explicitly', async () => {
    createConnectedStore();
    await supervisorApis.getDispositionCodesByCampaign(TEST_CAMPAIGN_ID);
    expect(paramsOf('campaignDispositions').info).toEqual(['false']);
  });

  it('#9 campaigns by user omits info entirely', async () => {
    createConnectedStore();
    await supervisorApis.getCampaignsAssignedByUserId('agent01');
    expect(paramsOf('userCampaigns')).not.toHaveProperty('info');
  });

  describe('#8 all contact-center users', () => {
    it('omits info when called the way the hover card calls it', async () => {
      createConnectedStore();
      await supervisorApis.getAllContactCenterUsers();
      expect(paramsOf('contactCenterUsers')).not.toHaveProperty('info');
    });

    it('still forwards info=true if anyone passes it — the footgun is live', async () => {
      createConnectedStore();
      await supervisorApis.getAllContactCenterUsers(true);
      // Unlike #2, #3 and #9, this wrapper exposes the parameter, so a
      // one-word change turns a working call into a hard 405. Asserted so the
      // exposure is visible rather than assumed away.
      expect(paramsOf('contactCenterUsers').info).toEqual(['true']);
    });
  });
});
