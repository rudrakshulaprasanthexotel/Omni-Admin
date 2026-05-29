import { Box } from "@exotel-npm-dev/signal-design-system";
import { Outlet, useNavigate } from "react-router-dom";
import TopNavBar from "./components/TopNavBar";
import { AuthGuard } from "@/shared/components/guards/AuthGuard";
import LeftSidebar from "./components/LeftSidebar";
import CopilotWidget from "@/features/copilot/components/CopilotWidget";
import {
    CopilotCommandRegistryProvider,
    useCopilotCommand,
} from "@/features/copilot/CopilotCommandRegistry";
import CopilotActionsRegistrar from "@/features/copilot/CopilotActionsRegistrar";

const AuthenticatedLayoutInner = () => {
    const navigate = useNavigate();

    useCopilotCommand("app.navigate", (args) => {
        const path = String(args.path ?? "");
        if (!path) return "No destination provided.";
        navigate(path);
        return `Navigated to ${path}.`;
    });

    return (
        <Box minHeight="100vh" display="flex" flexDirection="column">
            <TopNavBar />
            <Box flex={1} display="flex">
                <Box>
                    <LeftSidebar />
                </Box>
                <Box flex={1} bgcolor='surface.elevation0' p={1}>
                    <Box borderRadius={1} height='100%' bgcolor='surface.elevation1' p={1}>
                        <Outlet />
                    </Box>
                </Box>
            </Box>
            <CopilotWidget />
            <CopilotActionsRegistrar />
        </Box>
    );
};

const AuthenticatedLayout = () => {
    return (
        <AuthGuard>
            <CopilotCommandRegistryProvider>
                <AuthenticatedLayoutInner />
            </CopilotCommandRegistryProvider>
        </AuthGuard>
    )
}

export default AuthenticatedLayout;
