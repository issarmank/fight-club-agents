// app/page.tsx — the landing page.
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Ticker from "@/components/landing/Ticker";
import WhatItDoes from "@/components/landing/WhatItDoes";
import Personalities from "@/components/landing/Personalities";
import HowItWorks from "@/components/landing/HowItWorks";
import AccessCTA from "@/components/landing/AccessCTA";
import Details from "@/components/landing/Details";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <Ticker />
      <WhatItDoes />
      <Personalities />
      <HowItWorks />
      <AccessCTA />
      <Details />
      <Faq />
      <Footer />
    </>
  );
}
