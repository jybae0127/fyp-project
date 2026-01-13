import { useNavigate, useRoutes } from "react-router-dom";
import { useEffect } from "react";
import routes from "./config";
import OAuthListener from "./OAuthListener";

let navigateResolver;

export const navigatePromise = new Promise((resolve) => {
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
  }, [navigate]);

  return (
    <>
      <OAuthListener />
      {element}
    </>
  );
}
