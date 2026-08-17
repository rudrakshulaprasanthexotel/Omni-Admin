import { useState } from 'react';
import { Fab, Icon, type Theme } from '@exotel-npm-dev/signal-design-system';
import CopilotPanel from './CopilotPanel';

const CopilotWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Fab
        variant="extended"
        color="primary"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          gap: 1,
          textTransform: 'none',
          zIndex: (theme: Theme) => theme.zIndex.drawer - 1,
        }}
      >
        <Icon name="sparkle" weight="fill" />
        Copilot
      </Fab>
      <CopilotPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default CopilotWidget;
