import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { SiteShell } from "./components/SiteShell";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
  CommunityPage,
  FaqPage,
  HowItWorksPage,
  MeetLeePage,
  PrivacyPage,
} from "./pages/ContentPages";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import SantasSurpriseBox from "./pages/SantasSurpriseBox";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [location]);
  return null;
}

function Router() {
  return <><ScrollToTop /><SiteShell><Switch><Route path="/" component={Home} /><Route path="/how-it-works" component={HowItWorksPage} /><Route path="/meet-lee" component={MeetLeePage} /><Route path="/faqs" component={FaqPage} /><Route path="/community" component={CommunityPage} /><Route path="/santas-surprise-box" component={SantasSurpriseBox} /><Route path="/privacy" component={PrivacyPage} /><Route component={NotFound} /></Switch></SiteShell></>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><Router /></ThemeProvider></ErrorBoundary>;
}

export default App;
