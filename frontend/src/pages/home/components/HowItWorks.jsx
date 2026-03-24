import { useEffect, useRef, useState } from "react";

export default function HowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Connect Your Gmail",
      description: "Securely link your Gmail account with one click using OAuth 2.0. We only read job-related emails.",
      icon: "ri-google-line",
      color: "bg-blue-500",
      image: "/summary/1.png",
      imageClass: "max-h-32 max-w-[70%]"
    },
    {
      step: "2",
      title: "AI Analyzes Emails",
      description: "Our AI automatically scans your inbox, identifies job application emails, and extracts company and stage information.",
      icon: "ri-robot-line",
      color: "bg-purple-500",
      image: "/summary/2.png",
      imageClass: "max-h-full max-w-full"
    },
    {
      step: "3",
      title: "View Your Dashboard",
      description: "See all your applications in one place with visual timelines, funnel charts, and performance analytics.",
      icon: "ri-dashboard-line",
      color: "bg-green-500",
      image: "/summary/3.png",
      imageClass: "max-h-full max-w-full"
    }
  ];

  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -45% 0px" }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 bg-gray-50" ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Personalized Job Application Summary in 1 Click</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get started in under a minute. No manual data entry required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, i) => (
            <div
              key={i}
              className="relative h-full"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(40px)",
                transition: `opacity 0.6s ease, transform 0.6s ease`,
                transitionDelay: visible ? `${0.5 + i * 0.2}s` : "0s",
              }}
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gray-300"></div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center relative h-full hover:shadow-xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-default z-10">
                {/* Step badge */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center z-10">
                  <span className="text-sm font-bold text-gray-600">{item.step}</span>
                </div>

                {/* Image */}
                <div className="w-full h-52 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                  <img src={item.image} alt={item.title} className={`object-contain rounded-lg drop-shadow-md ${item.imageClass}`} />
                </div>

                <div className="p-8">
                  {/* Step icon */}
                  <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <i className={`${item.icon} text-white text-xl`}></i>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
