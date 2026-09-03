import { useAppSelector } from "@/store/hooks";
import { selectSessionId } from "@/features/auth/authSlice";
import { useKeepAlive } from "@/features/auth/mutations";
import { useEffect } from "react";

const KEEP_ALIVE_INTERVAL_MS = 20_000;

const usePingPush = () => {
  const sessionId = useAppSelector(selectSessionId);
  const keepAlive = useKeepAlive();
  const { mutate } = keepAlive;

  useEffect(() => {
    if (!sessionId) return;

    const intervalId = setInterval(() => {
      mutate({ sessionId });
    }, KEEP_ALIVE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [sessionId, mutate]);

  return null;
}

export default usePingPush;
