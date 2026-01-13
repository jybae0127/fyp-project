import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGmailPopup from "../../hooks/useGmailPopup";

export default function CTA() {
  const navigate = useNavigate();
  const openPopup = useGmailPopup();

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("gmail_connected") === "true";
    setIsAuthenticated(auth);

    // Listen for auth events
    const handleAuthSuccess = () => setIsAuthenticated(true);
    const handleAuthSignout = () => setIsAuthenticated(false);

    window.addEventListener("auth-success", handleAuthSuccess);
    window.addEventListener("auth-signout", handleAuthSignout);

    return () => {
      window.removeEventListener("auth-success", handleAuthSuccess);
      window.removeEventListener("auth-signout", handleAuthSignout);
    };
  }, []);

  const handleClick = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      openPopup();
    }
  };

  return (
    <section className="py-24 bg-white text-center">
      <h2 className="text-4xl font-bold mb-6">
        Ready to transform your job search?
      </h2>
      <p className="text-xl text-gray-600 mb-10">
        Start tracking your applications with AI insights — no credit card needed.
      </p>

      <button
        onClick={handleClick}
        className="btn-shine px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl hover:scale-105 hover:-translate-y-1"
      >
        {isAuthenticated ? (
          <>
            <i className="ri-dashboard-line mr-2"></i>
            Go to Dashboard
          </>
        ) : (
          <>
            <i className="ri-google-fill mr-2"></i>
            Connect Gmail & Start
          </>
        )}
      </button>
    </section>
  );
}
