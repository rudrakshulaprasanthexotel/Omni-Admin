import { keepAliveWithPingPush } from "@/features/auth/asyncActions";
import { selectLoginResponse } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect, useRef } from "react";


const usePingPush = () => {
  const dispatch = useAppDispatch();
  const loginResponse = useAppSelector(selectLoginResponse);
  const intervalId = useRef<number | null>(null);

  useEffect(() => {
    if (loginResponse?.userSessionInfo?.sessionId) {
      intervalId.current = setInterval(() => {
        dispatch(keepAliveWithPingPush({
          sessionId: loginResponse?.userSessionInfo?.sessionId ?? "",
        }));
      }, 20000);
    }

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    }
  }, [loginResponse]);

  return null;
}

export default usePingPush;
