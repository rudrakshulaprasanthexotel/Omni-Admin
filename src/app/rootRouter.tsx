import type { RouteObject } from "react-router-dom";
import { routes } from "./routes";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { HydrateFallback } from "@/shared/components/feedback/HydrateFallback";


export const rootRouter: RouteObject[] = [
  {
    hydrateFallbackElement: <HydrateFallback />,
    ErrorBoundary: ErrorBoundary,
    children: [
      ...routes,
    ]
  }
];
