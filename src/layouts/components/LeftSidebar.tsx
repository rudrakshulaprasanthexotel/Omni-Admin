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

/** Full admin nav — restore when those routes ship */
export const dummyAdminNavigationSections: NavSectionProps[] = [
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
    : dummyAdminNavigationSections;

  const handleNavigate = (item: NavItemPayload) => {
    if (item.path) navigate(item.path);
  };

  return (
    <Navigation onNavigate={handleNavigate} items={navigationSections} />
  );
};

export default LeftSidebar;
