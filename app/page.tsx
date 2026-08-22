import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HelpSection from "@/components/HelpSection";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Process from "@/components/Process";
import About from "@/components/About";
import Maintenance from "@/components/Maintenance";
import SectionDivider from "@/components/SectionDivider";
import FAQ from "@/components/FAQ";
import Newsletter from "@/components/Newsletter";
import Contact from "@/components/Contact";
import ClosingStatement from "@/components/ClosingStatement";
import Footer from "@/components/Footer";
import ScrollToHash from "@/components/ScrollToHash";
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <>
      <ScrollToHash />
      <Header />
      <main>
        <Hero />
        <HelpSection />
        <Services />
        <Portfolio />
        <SectionDivider variant="to-dark-over" />
        <Process />
        <SectionDivider variant="to-light-flip" />
        <About />
        <SectionDivider variant="to-dark" />
        <Maintenance />
        <SectionDivider variant="to-light-flip" />
        <FAQ />
        <div className="site-dark-tail">
          <div className="site-dark-tail-ambient" aria-hidden="true" />
          <Contact />
          <ClosingStatement />
          <Newsletter />
        </div>
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
