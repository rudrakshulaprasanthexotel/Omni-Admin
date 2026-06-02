import { useNavigate } from "react-router-dom";
import { AppBar, useThemeMode } from "@exotel-npm-dev/signal-design-system";
import { BRAND_LOGO_URL } from "@/configs/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectLoginResponse, clearLoginResponse } from "@/features/auth/authSlice";
import { logout } from "@/features/auth/asyncActions";

const TopNavBar = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const loginResponse = useAppSelector(selectLoginResponse);
    const { setMode, mode } = useThemeMode();

    const userName = loginResponse?.userSessionInfo?.userName ?? "User";

    const handleLogout = async () => {
        await dispatch(logout({
            sessionId: loginResponse?.userSessionInfo?.sessionId ?? "",
            reason: "User logged out",
        }))
        dispatch(clearLoginResponse());
        navigate("/login", { replace: true });
    };

    return (
        <AppBar
            avatarName={userName}
            avatarMenuGroups={[]}
            avatarFooterInfo={[]}
            avatarSelectedTheme={mode}
            onAvatarThemeChange={setMode}
            onAvatarLogout={handleLogout}
            brandLogo={BRAND_LOGO_URL}
        />
    );
};

export default TopNavBar;
