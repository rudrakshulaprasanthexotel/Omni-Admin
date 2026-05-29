import { useState } from 'react';
import { Box, ChatInputBox, Drawer, Icon, Typography } from '@exotel-npm-dev/signal-design-system';
import { useCopilotChat } from '@copilotkit/react-core';
import { Role, TextMessage } from '@copilotkit/runtime-client-gql';

interface CopilotPanelProps {
  open: boolean;
  onClose: () => void;
}

const CopilotPanel = ({ open, onClose }: CopilotPanelProps) => {
  const [value, setValue] = useState('');
  const { visibleMessages, appendMessage, isLoading } = useCopilotChat();

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    appendMessage(new TextMessage({ content: trimmed, role: Role.User }));
    setValue('');
  };

  const textMessages = (visibleMessages ?? []).filter(
    (message): message is TextMessage => message.isTextMessage?.(),
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Copilot"
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {textMessages.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon name="sparkle" weight="fill" color="#7C4DFF" />
                <Typography variant="h6">Hello! How can I help?</Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                I'm your Omni Admin Copilot. Ask me anything about users, queues, analytics, or
                settings, and I'll help you get things done faster.
              </Typography>
            </Box>
          ) : (
            textMessages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  alignSelf: message.role === Role.User ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: message.role === Role.User ? 'primary.main' : 'surface.elevation2',
                  color: message.role === Role.User ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Typography variant="body2">{message.content}</Typography>
              </Box>
            ))
          )}
          {isLoading && (
            <Typography variant="body2" color="text.secondary">
              Copilot is thinking…
            </Typography>
          )}
        </Box>
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <ChatInputBox
            value={value}
            onChange={setValue}
            onSend={handleSend}
            placeholder="Ask Copilot anything..."
            sendDisabled={isLoading}
          />
        </Box>
      </Box>
    </Drawer>
  );
};

export default CopilotPanel;
