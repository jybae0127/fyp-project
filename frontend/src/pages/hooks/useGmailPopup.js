export default function useGmailPopup() {
  return () => {
    return new Promise((resolve) => {
      // Use Render for OAuth
      const url = "https://gmail-login-backend.onrender.com/";
      const w = 500;
      const h = 650;

      const left = window.screenX + (window.outerWidth - w) / 2;
      const top = window.screenY + (window.outerHeight - h) / 2;

      const popup = window.open(
        url,
        "GoogleLoginPopup",
        `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      // Listen for auth success message from popup
      const handleMessage = (event) => {
        if (event.data?.status === "success" && event.data?.authenticated) {
          localStorage.setItem("gmail_connected", "true");
          window.removeEventListener("message", handleMessage);
          resolve(true);
        }
      };

      window.addEventListener("message", handleMessage);

      // Check if popup was closed without auth
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          // Check if auth happened before popup closed
          const isConnected = localStorage.getItem("gmail_connected") === "true";
          resolve(isConnected);
        }
      }, 500);
    });
  };
}
