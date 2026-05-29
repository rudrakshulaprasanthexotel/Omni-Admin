import { Navigation, type NavSectionProps } from "@exotel-npm-dev/signal-design-system";

const navigationSections: NavSectionProps[] = [
    {
        label: 'Main',
        items: [
            { id: 'dashboard', label: 'Dashboard', iconName: 'house', path: '/dashboard', openNewPage: false },
            { id: 'analytics', label: 'Analytics', iconName: 'chart-bar', path: '/analytics', openNewPage: false },
        ],
    },
    {
        label: 'Management',
        items: [
            { id: 'users', label: 'Users', iconName: 'users', path: '/users', openNewPage: false },
            { id: 'queues', label: 'Queues', iconName: 'queue', path: '/queues', openNewPage: false },
            { id: 'audit', label: 'Audit Logs', iconName: 'clipboard-text', path: '/audit', openNewPage: false },
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
    return (
        <Navigation items={navigationSections} />
    );
};

export default LeftSidebar;
