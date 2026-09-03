import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { useCustomerHoverCard } from '../hooks/useCustomerHoverCard';
import { useUserHoverCard } from '../hooks/useUserHoverCard';
import { serveScenarios } from '@/test/msw/activeScenario';
import { requestCount } from '@/test/msw/requestLog';
import { renderHookWithProviders } from '@/test/renderWithProviders';
import { TEST_CAMPAIGN_ID } from '@/test/fixtures/auth';
import { tr } from '@/test/i18n';

/**
 * The hover cards are the only surface in this feature that reports a failure
 * to the user rather than silently emptying itself — worth locking in, along
 * with the two behaviours the doc singles out: #8 and #9 are bundled under one
 * `Promise.all`, and failures are not negatively cached.
 *
 * Driven through `onOpenChange` rather than a simulated hover: that callback
 * is the component's entire contract with the design system's popover, and
 * calling it directly keeps the test off third-party timing.
 */

function openUserCard(userId = 'agent01') {
  return renderHookWithProviders(() =>
    useUserHoverCard({ name: 'Ravi Kumar', userId }),
  );
}

describe('user hover card (#8 + #9)', () => {
  it('CCU-200 + UC-200 — merges the directory entry with the user\'s campaigns', async () => {
    const { result } = openUserCard();

    await act(async () => {
      result.current.onOpenChange(true);
    });

    await waitFor(() => expect(result.current.data.sections).toBeDefined());
    expect(result.current.data.title).toBe('Ravi Kumar');
    expect(result.current.data.subtitle).toBe('@agent01');
    expect(result.current.data.footer).toBeUndefined();
    expect(result.current.data.sections?.[0].items).toEqual([
      { id: '42', label: 'Outbound Sales' },
    ]);
  });

  it('is disabled without a userId, so no request is made', async () => {
    const { result } = renderHookWithProviders(() =>
      useUserHoverCard({ name: 'Unknown', userId: undefined }),
    );

    expect(result.current.enabled).toBe(false);
    await act(async () => {
      result.current.onOpenChange(true);
    });
    expect(requestCount('contactCenterUsers')).toBe(0);
  });

  it('CCU-512 — a directory failure shows the load error footer', async () => {
    serveScenarios('CCU-512');
    const { result } = openUserCard();

    await act(async () => {
      result.current.onOpenChange(true);
    });

    await waitFor(() =>
      expect(result.current.data.footer).toBe(tr('hoverCardLoadError')),
    );
    // Falls back to the raw id rather than showing nothing.
    expect(result.current.data.subtitle).toBe('@agent01');
  });

  it('UC-512 — a campaign failure discards the directory result too', async () => {
    // #8 succeeds and #9 fails, but they share one `Promise.all`, so the
    // successfully-fetched user record is thrown away with it.
    serveScenarios('UC-512-user-not-found');
    const { result } = openUserCard();

    await act(async () => {
      result.current.onOpenChange(true);
    });

    await waitFor(() =>
      expect(result.current.data.footer).toBe(tr('hoverCardLoadError')),
    );
    expect(requestCount('contactCenterUsers')).toBe(1);
    expect(result.current.data.sections).toBeUndefined();
  });

  it('caches the directory across opens — the bulk fetch happens once', async () => {
    const { result } = openUserCard();

    await act(async () => {
      result.current.onOpenChange(true);
    });
    await waitFor(() => expect(requestCount('contactCenterUsers')).toBe(1));

    await act(async () => {
      result.current.onOpenChange(false);
      result.current.onOpenChange(true);
    });

    expect(requestCount('contactCenterUsers')).toBe(1);
  });

  it('does not negatively cache — a transient failure self-heals on reopen', async () => {
    serveScenarios('CCU-512');
    const { result } = openUserCard();

    await act(async () => {
      result.current.onOpenChange(true);
    });
    await waitFor(() =>
      expect(result.current.data.footer).toBe(tr('hoverCardLoadError')),
    );

    // `loadCached` deletes the entry on rejection, so the next open retries.
    serveScenarios('CCU-200');
    await act(async () => {
      result.current.onOpenChange(true);
    });

    await waitFor(() => expect(result.current.data.footer).toBeUndefined());
    expect(requestCount('contactCenterUsers')).toBe(2);
  });
});

describe('customer hover card (#10)', () => {
  function openCustomerCard() {
    return renderHookWithProviders(() =>
      useCustomerHoverCard({
        name: 'Nita Sharma',
        customerId: 'cust-1',
        campaignId: TEST_CAMPAIGN_ID,
      }),
    );
  }

  it('CI-200 — populates the card from the single customer object', async () => {
    const { result } = openCustomerCard();

    await act(async () => {
      result.current.onOpenChange(true);
    });

    await waitFor(() => expect(requestCount('customerInfo')).toBe(1));
    expect(result.current.data.title).toBe('Nita Sharma');
    expect(result.current.data.footer).toBeUndefined();
  });

  it('CI-404 — "no such customer" and a backend outage look identical', async () => {
    // #10 has no 512 and no privilege check, so infrastructure faults surface
    // as 404 alongside genuinely missing customers.
    serveScenarios('CI-404');
    const { result } = openCustomerCard();

    await act(async () => {
      result.current.onOpenChange(true);
    });

    await waitFor(() =>
      expect(result.current.data.footer).toBe(tr('hoverCardLoadError')),
    );
    expect(result.current.data.title).toBe('Nita Sharma');
  });

  it('stays disabled without a campaignId', async () => {
    const { result } = renderHookWithProviders(() =>
      useCustomerHoverCard({ name: 'Nita Sharma', customerId: 'cust-1' }),
    );

    expect(result.current.enabled).toBe(false);
    await act(async () => {
      result.current.onOpenChange(true);
    });
    expect(requestCount('customerInfo')).toBe(0);
  });
});
