import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Divider,
  EnhancedTextField,
  MenuItem,
  Switch,
  Typography,
} from '@exotel-npm-dev/signal-design-system';

interface SettingsState {
  organizationName: string;
  supportEmail: string;
  theme: 'system' | 'light' | 'dark';
  language: 'en' | 'ar';
  emailNotifications: boolean;
  desktopNotifications: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: '15' | '30' | '60' | '120';
}

const DEFAULT_SETTINGS: SettingsState = {
  organizationName: 'Exotel Contact Center',
  supportEmail: 'support@example.com',
  theme: 'system',
  language: 'en',
  emailNotifications: true,
  desktopNotifications: false,
  twoFactorAuth: true,
  sessionTimeout: '30',
};

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingsSection = ({ title, description, children }: SettingsSectionProps) => (
  <Card sx={{ p: 3 }}>
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
    <Divider sx={{ mb: 2 }} />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>{children}</Box>
  </Card>
);

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleRow = ({ label, description, checked, onChange }: ToggleRowProps) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
    <Box>
      <Typography variant="body1">{label}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
    <Switch checked={checked} onChange={(_, value) => onChange(value)} />
  </Box>
);

export function Component() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  const update = <K extends keyof SettingsState>(field: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const handleSave = () => setSavedSettings(settings);
  const handleReset = () => setSettings(savedSettings);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4">Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Customize application preferences and system configuration.
        </Typography>
      </Box>

      <SettingsSection title="General" description="Basic organization and contact details.">
        <EnhancedTextField
          label="Organization Name"
          value={settings.organizationName}
          onChange={(e) => update('organizationName', e.target.value)}
          fullWidth
        />
        <EnhancedTextField
          label="Support Email"
          type="email"
          value={settings.supportEmail}
          onChange={(e) => update('supportEmail', e.target.value)}
          fullWidth
        />
      </SettingsSection>

      <SettingsSection title="Appearance" description="Control how the application looks and feels.">
        <EnhancedTextField
          label="Theme"
          select
          value={settings.theme}
          onChange={(e) => update('theme', e.target.value as SettingsState['theme'])}
          fullWidth
        >
          <MenuItem value="system">System Default</MenuItem>
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
        </EnhancedTextField>
        <EnhancedTextField
          label="Language"
          select
          value={settings.language}
          onChange={(e) => update('language', e.target.value as SettingsState['language'])}
          fullWidth
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="ar">العربية (Arabic)</MenuItem>
        </EnhancedTextField>
      </SettingsSection>

      <SettingsSection title="Notifications" description="Choose how you want to be notified.">
        <ToggleRow
          label="Email Notifications"
          description="Receive activity summaries and alerts via email."
          checked={settings.emailNotifications}
          onChange={(value) => update('emailNotifications', value)}
        />
        <ToggleRow
          label="Desktop Notifications"
          description="Show real-time notifications in your browser."
          checked={settings.desktopNotifications}
          onChange={(value) => update('desktopNotifications', value)}
        />
      </SettingsSection>

      <SettingsSection title="Security" description="Manage authentication and session preferences.">
        <ToggleRow
          label="Two-Factor Authentication"
          description="Require a verification code at sign-in."
          checked={settings.twoFactorAuth}
          onChange={(value) => update('twoFactorAuth', value)}
        />
        <EnhancedTextField
          label="Session Timeout"
          select
          value={settings.sessionTimeout}
          onChange={(e) =>
            update('sessionTimeout', e.target.value as SettingsState['sessionTimeout'])
          }
          fullWidth
        >
          <MenuItem value="15">15 minutes</MenuItem>
          <MenuItem value="30">30 minutes</MenuItem>
          <MenuItem value="60">1 hour</MenuItem>
          <MenuItem value="120">2 hours</MenuItem>
        </EnhancedTextField>
      </SettingsSection>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" color="secondary" disabled={!isDirty} onClick={handleReset}>
          Reset
        </Button>
        <Button variant="contained" disabled={!isDirty} onClick={handleSave}>
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}
