import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import About from "./components/About";
import HowItWorks from "./components/HowItWorks";
import Solution from "./components/Solution";
import ValueProps from "./components/ValueProps";
import Stats from "./components/Stats";
import CTA from "./components/CTA";
export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <HowItWorks />
      <About />
      <Solution />
      <Features />
      <ValueProps />
      <Stats />
      <CTA />
    </>
  );
}
