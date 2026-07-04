import HeroSlider from '../components/HeroSlider.jsx';
import StepsSection from '../components/StepsSection.jsx';
import StatsSection from '../components/StatsSection.jsx';
import NewsTabsSection from '../components/NewsTabsSection.jsx';
import Newsletter from '../components/Newsletter.jsx';
import BottomColumns from '../components/BottomColumns.jsx';

export default function Home() {
  return (
    <>
      <HeroSlider />
      <StepsSection />
      <StatsSection />
      <NewsTabsSection />
      <Newsletter />
      <BottomColumns />
    </>
  );
}
