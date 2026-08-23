import Navbar from "@/components/Navbar/Navbar";
import Hero from "@/components/Hero/Hero";
import FounderStory from "@/components/FounderStory/FounderStory";
import Reviews from "@/components/Reviews/Reviews";
import GalleryPreview from "@/components/GalleryPreview/GalleryPreview";
import Journey from "@/components/Journey/Journey";
import ProblemSolution from "@/components/ProblemSolution/ProblemSolution";
import Highlights from "@/components/Highlights/Highlights";
import Difference from "@/components/Difference/Difference";
import Curriculum from "@/components/Curriculum/Curriculum";
import Mentors from "@/components/Mentors/Mentors";
import Approach from "@/components/Approach/Approach";
import Footer from "@/components/Footer/Footer";
import Section from "@/components/Section/Section";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FounderStory />

        <Section id="reviews" background="primary" padding="lg">
          <Reviews />
        </Section>

        <GalleryPreview />
        <Journey />

        <Section id="why-us" background="secondary" padding="xl">
          <ProblemSolution />
        </Section>

        <Section id="highlights" background="primary" padding="lg">
          <Highlights />
        </Section>

        <Section background="secondary" padding="lg">
          <Difference />
        </Section>

        <Section id="curriculum" background="primary" padding="lg">
          <Curriculum />
        </Section>

        <Mentors />

        <Section id="approach" background="secondary" padding="xl">
          <Approach />
        </Section>
      </main>
      <Footer />
    </>
  );
}
