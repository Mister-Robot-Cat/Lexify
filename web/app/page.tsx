import Hero from './sections/Hero'
import HowItWorks from './sections/HowItWorks'
import WhyTelegram from './sections/WhyTelegram'
import BeforeAfter from './sections/BeforeAfter'
import UseCases from './sections/UseCases'
import Stats from './sections/Stats'
import TechStack from './sections/TechStack'
import Roadmap from './sections/Roadmap'
import Pricing from './sections/Pricing'
import FAQ from './sections/FAQ'
import OpenSource from './sections/OpenSource'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Hero />
      <HowItWorks />
      <WhyTelegram />
      <BeforeAfter />
      <UseCases />
      <Stats />
      <TechStack />
      <Roadmap />
      <Pricing />
      <FAQ />
      <OpenSource />
      <Footer />
    </main>
  )
}
