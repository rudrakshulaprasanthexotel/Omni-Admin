import { useNavigate } from "react-router-dom";
import { AppBar, useThemeMode } from "@exotel-npm-dev/signal-design-system";
import { BRAND_LOGO_URL } from "@/configs/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectLoginResponse, clearLoginResponse } from "@/features/auth/authSlice";

const TopNavBar = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const loginResponse = useAppSelector(selectLoginResponse);
    const { setMode, mode } = useThemeMode();

    const userName = loginResponse?.userSessionInfo?.userName ?? "User";

    const handleLogout = () => {
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
