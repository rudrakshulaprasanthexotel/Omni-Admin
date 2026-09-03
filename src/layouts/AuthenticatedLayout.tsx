import { Box } from "@exotel-npm-dev/signal-design-system";
import { Outlet } from "react-router-dom";
import TopNavBar from "./components/TopNavBar";
import { AuthGuard } from "@/shared/components/guards/AuthGuard";
import LeftSidebar from "./components/LeftSidebar";
import RightPanel from "./components/RightPanel";
import usePingPush from "@/features/auth/hooks/usePingPush";
import useSessionBootstrap from "@/features/auth/hooks/useSessionBootstrap";


const AuthenticatedLayout = () => {
  usePingPush();
  useSessionBootstrap();

  return (
    <AuthGuard>
      <Box height="100vh" display="flex" flexDirection="column">
        <TopNavBar />
        <Box flex={1} display="flex" minHeight={0}>
          <Box>
            <LeftSidebar />
          </Box>
          <Box flex={1} minWidth={0} bgcolor='surface.elevation0' p={1} overflow='hidden'>
            <Box borderRadius={1} height='100%' minHeight={0} minWidth={0} bgcolor='surface.elevation1' overflow='auto'>
              <Outlet />
            </Box>
          </Box>
          <RightPanel />
        </Box>
      </Box>
    </AuthGuard>
  )
}

export default AuthenticatedLayout;
