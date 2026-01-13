import { useNavigate, type NavigateFunction, useRoutes } from "react-router-dom";
import { useEffect } from "react";
import routes from "./config";
import OAuthListener from "./OAuthListener";

let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

declare global {
  interface Window {
    REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

export function AppRoutes() {
  const element = useRoutes(routes);
  const navigate = useNavigate();

  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    if (navigateResolver) {
      navigateResolver(window.REACT_APP_NAVIGATE);
    }
  }, [navigate]); // 한 번만 세팅되도록

  return (
    <>
      <OAuthListener />   {/* 👈 popup에서 오는 postMessage 감지 */}
      {element}           {/* 실제 라우트들(Home, Dashboard, …) */}
    </>
  );
}
