import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { PlatformGrid } from './components/PlatformGrid';
import { Quickstart } from './components/Quickstart';
import { Architecture } from './components/Architecture';
import { Testimonial } from './components/Testimonial';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Nav />
      <Hero />
      <Marquee />
      <PlatformGrid />
      <Quickstart />
      <Architecture />
      <Testimonial />
      <CTA />
      <Footer />
    </main>
  );
}
