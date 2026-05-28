import { useMediaQuery, useTheme } from "@exotel-npm-dev/signal-design-system"


const useIsMobile = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    return isMobile;
};

export default useIsMobile;
