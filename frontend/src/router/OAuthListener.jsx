import { useEffect } from "react";

export default function OAuthListener() {
  useEffect(() => {
    const handler = (event) => {
      if (!event.data) return;

        if (event.data.status === "success") {
        localStorage.setItem("authenticated", "true");

        window.dispatchEvent(new Event("auth-success"));

        window.REACT_APP_NAVIGATE("/dashboard");
        }

    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return null;
}
