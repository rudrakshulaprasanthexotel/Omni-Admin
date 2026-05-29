import { Box } from "@exotel-npm-dev/signal-design-system";
import { Outlet } from "react-router-dom";
import TopNavBar from "./components/TopNavBar";
import { AuthGuard } from "@/shared/components/guards/AuthGuard";
import LeftSidebar from "./components/LeftSidebar";


const AuthenticatedLayout = () => {
    return (
        <AuthGuard>
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
            </Box>
        </AuthGuard>
    )
}

export default AuthenticatedLayout;
