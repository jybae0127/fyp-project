import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGmailPopup from "../../hooks/useGmailPopup";

const images = ["/main_page_img1.png", "/main_page_img2.png"];

export default function Hero() {
  const navigate = useNavigate();
  const openPopup = useGmailPopup();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      openPopup();
    }
  };

  return (
    <section className="relative pt-20 pb-32 bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
      {/* Gradient Blobs Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-60 left-1/3 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-20 left-1/4 w-[500px] h-[500px] bg-pink-300 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 right-1/4 w-80 h-80 bg-cyan-300 rounded-full filter blur-3xl opacity-45 animate-blob animation-delay-4000"></div>
      </div>
      {/* White gradient overlay/mask */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/50"></div>

      <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
        <h1 className="text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_200%] bg-[position:0%_50%] hover:bg-[position:100%_50%] transition-all duration-700 cursor-default">Automated Job Application</span>{" "}
          <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent animate-gradient">Tracker</span>
        </h1>

        <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
          Connect your Gmail once — we handle the rest automatically.
        </p>
        <p className="text-lg text-gray-500 mb-6 max-w-2xl mx-auto">
          AI scans your inbox, detects job-related emails, classifies them by stage, and visualizes your entire application pipeline.
        </p>

        {/* One-click badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-6 border border-blue-200">
          <i className="ri-google-fill text-red-500"></i>
          <span className="text-sm font-semibold text-gray-700">One-Click Gmail Integration</span>
          <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">FREE</span>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
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

          <button className="btn-shine px-6 py-3 border border-gray-300 text-gray-700 text-lg font-semibold rounded-xl transition-all duration-300 hover:bg-gray-100 hover:border-gray-400 hover:shadow-md hover:scale-105 hover:-translate-y-1">
            <i className="ri-play-circle-line mr-2"></i>
            Watch Demo
          </button>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
          <span className="flex items-center gap-1"><i className="ri-shield-check-line text-green-500"></i> Secure OAuth 2.0</span>
          <span className="flex items-center gap-1"><i className="ri-lock-line text-green-500"></i> No passwords stored</span>
          <span className="flex items-center gap-1"><i className="ri-mail-forbid-line text-green-500"></i> No raw emails stored</span>
          <span className="flex items-center gap-1"><i className="ri-time-line text-green-500"></i> Setup in 30 seconds</span>
        </div>

        <div className="mt-12 relative h-[600px] overflow-hidden rounded-2xl shadow-2xl border bg-gray-100">
          {images.map((src, index) => (
            <img
              key={src}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
              src={src}
              alt={`Dashboard preview ${index + 1}`}
            />
          ))}
          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-gray-300/70 px-3 py-2 rounded-full">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentImageIndex
                    ? "bg-blue-500 w-6"
                    : "bg-gray-400 hover:bg-gray-300"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
