import { Box } from "@exotel-npm-dev/signal-design-system";
import { Outlet } from "react-router-dom";
import TopNavBar from "./components/TopNavBar";
import { AuthGuard } from "@/shared/components/guards/AuthGuard";
import LeftSidebar from "./components/LeftSidebar";
import CopilotWidget from "@/features/copilot/components/CopilotWidget";
import usePingPush from "@/features/auth/hooks/usePingPush";


const AuthenticatedLayout = () => {
  usePingPush();

  return (
    <AuthGuard>
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <TopNavBar />
        <Box flex={1} display="flex">
          <Box>
            <LeftSidebar />
          </Box>
          <Box flex={1} bgcolor='surface.elevation0' p={0.5}>
            <Box borderRadius={1} height='100%' bgcolor='surface.elevation1' p={0.5}>
              <Outlet />
            </Box>
          </Box>
        </Box>
        <CopilotWidget />
      </Box>
    </AuthGuard>
  )
}

export default AuthenticatedLayout;
