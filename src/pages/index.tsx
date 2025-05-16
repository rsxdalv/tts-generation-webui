import Head from "next/head";
import Hero from "../components/hero";
import Navbar from "../components/navbar";
import SectionTitle from "../components/sectionTitle";

import { benefitOne, benefitTwo } from "../components/data";
import Video from "../components/video";
import Benefits from "../components/benefits";
import Footer from "../components/footer";
import Testimonials from "../components/testimonials";
import Cta from "../components/cta";
import Faq from "../components/faq";
import PopupWidget from "../components/popupWidget";

const Home = () => {
  return (
    <>
      <Head>
        <title>TTS WebUI / Harmonica</title>
        <meta name="description" content="TTS WebUI / Harmonica" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <Hero />
      
      <SectionTitle
        pretitle="Features"
        title="What can you do with this webui?">
        This webui allows you to generate audio from text using various models, including Bark, MusicGen, Tortoise, and RVC.
      </SectionTitle>
      <Benefits data={benefitOne} />
      <Benefits imgPos="right" data={benefitTwo} />
      <SectionTitle
        pretitle="Watch a video"
        title="Here's a short video demo">
        This video shows the different tabs available in the webui.
      </SectionTitle>
      <Video />
      {/* <SectionTitle
        pretitle="Testimonials"
        title="Here's what our customers said">
        Testimonails is a great way to increase the brand trust and awareness.
        Use this section to highlight your popular customers.
      </SectionTitle> */}
      {/* <Testimonials /> */}
      {/* <SectionTitle pretitle="FAQ" title="Frequently Asked Questions">
        Answer your customers possible questions here, it will increase the
        conversion rate as well as support or chat requests.
      </SectionTitle> */}
      {/* <Faq /> */}
      {/* <Cta /> */}
      <Footer />
      {/* <PopupWidget /> */}
    </>
  );
};

export default Home;
