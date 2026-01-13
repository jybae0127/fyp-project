import { useEffect } from "react";

export default function OAuthListener() {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data) return;

        if (event.data.status === "success") {
        localStorage.setItem("authenticated", "true");

        // 🔥 전역 이벤트 발행해서 모든 컴포넌트에게 알림
        window.dispatchEvent(new Event("auth-success"));

        window.REACT_APP_NAVIGATE("/dashboard");
        }

    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return null;
}
