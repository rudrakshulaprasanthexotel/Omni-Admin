import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataGrid } from '@exotel-npm-dev/signal-design-system';
import { renderWithProviders } from '@/test/renderWithProviders';

/**
 * Isolated reproduction of a design-system bug that makes the interaction
 * list's error state unreachable.
 *
 * `InteractionDetailsPage` computes `emptyStateMessage` from the fetch result:
 * "select a campaign", then "no interactions match your filters", then
 * "something went wrong" once a request fails. The grid mounts before the
 * first response lands, so by the time the error message is passed the grid
 * has already captured the earlier value — and never re-reads the prop. A
 * supervisor hitting a 403, a 500 or a dropped connection is told their
 * filters matched nothing.
 *
 * Reproduced here with no Redux, no MSW and no page code so the cause is
 * unambiguous. `InteractionDetailsPage.test.tsx` asserts the resulting
 * user-visible behaviour and points back here.
 */
function EmptyStateHarness() {
  const [message, setMessage] = useState('Nothing matched your filters.');
  return (
    <div>
      <button type="button" onClick={() => setMessage('Something went wrong.')}>
        trigger error
      </button>
      <DataGrid
        rows={[]}
        columns={[{ field: 'name', headerName: 'Name' }]}
        emptyStateMessage={message}
        disableVirtualization
      />
    </div>
  );
}

describe('Signal DataGrid — emptyStateMessage', () => {
  it('ignores prop updates after mount, stranding the error copy', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmptyStateHarness />);

    await waitFor(() => expect(screen.getByRole('grid')).toBeInTheDocument());
    expect(screen.getByText('Nothing matched your filters.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'trigger error' }));

    // Asserted as the bug, not the intent. When the design system starts
    // honouring the prop, this test fails and the two page-level tests that
    // cite it can be flipped to expect the error copy.
    expect(screen.getByText('Nothing matched your filters.')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
  });
});
