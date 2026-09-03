import { useNavigate } from "react-router-dom";
import { AppBar, useThemeMode } from "@exotel-npm-dev/signal-design-system";
import { BRAND_LOGO_URL } from "@/configs/constants";
import { useAppSelector } from "@/store/hooks";
import { selectLoginResponse } from "@/features/auth/authSlice";
import { useLogout } from "@/features/auth/mutations";

const TopNavBar = () => {
  const navigate = useNavigate();
  const loginResponse = useAppSelector(selectLoginResponse);
  const logout = useLogout();
  const { setMode, mode } = useThemeMode();

  const userName = loginResponse?.userSessionInfo?.userName ?? "User";

  const handleLogout = async () => {
    await logout
      .mutateAsync({
        sessionId: loginResponse?.userSessionInfo?.sessionId ?? "",
        reason: "User logged out",
      })
      .catch(() => undefined);
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
