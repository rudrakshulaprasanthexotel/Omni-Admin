import { Navigation, type NavItemPayload, type NavSectionProps } from "@exotel-npm-dev/signal-design-system";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { selectLoginResponse } from "@/features/auth/authSlice";

const adminNavigationSections: NavSectionProps[] = [
  {
    items: [
      { id: 'process', label: 'Process', iconName: 'gear-fine', path: '/process' },
    ]
  }
]

// eslint-disable-next-line
const dummyAdminNavigationSections: NavSectionProps[] = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', iconName: 'house', path: '/dashboard' },
      { id: 'analytics', label: 'Analytics', iconName: 'chart-bar', path: '/analytics' },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'users', label: 'Users', iconName: 'users', path: '/users' },
      { id: 'queues', label: 'Queues', iconName: 'queue', path: '/queues' },
      { id: 'audit', label: 'Audit Logs', iconName: 'clipboard-text', path: '/audit' },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { id: 'settings', label: 'Settings', iconName: 'gear', path: '/settings' },
      { id: 'help', label: 'Help', iconName: 'question', path: '/help' },
    ],
  },
];

const supervisorNavigationSections: NavSectionProps[] = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', iconName: 'house', path: '/dashboard', openNewPage: false },
      { id: 'monitoring', label: 'Live Monitoring', iconName: 'chart-bar', path: '/monitoring', openNewPage: false },
      { id: 'team', label: 'Team Performance', iconName: 'users', path: '/team', openNewPage: false },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { id: 'settings', label: 'Settings', iconName: 'gear', path: '/settings', openNewPage: false },
      { id: 'help', label: 'Help', iconName: 'question', path: '/help', openNewPage: false },
    ],
  },
];

const LeftSidebar = () => {
  const navigate = useNavigate();
  const loginResponse = useAppSelector(selectLoginResponse);
  const userType = loginResponse?.userSessionInfo?.userType?.toLowerCase() ?? '';

  const navigationSections = userType === 'supervisor'
    ? supervisorNavigationSections
    : adminNavigationSections;

  const handleNavigate = (item: NavItemPayload) => {
    navigate(item.path);
  };

  return (
    <Navigation onNavigate={handleNavigate} items={navigationSections} />
  );
};

export default LeftSidebar;
