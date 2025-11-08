import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import SkinchateChatbot from "./pages/skincare-chatbot";
import RoutineRecommendations from "./pages/routine-recommendations";
import LandingPage from "./pages/landing-page";
import ProductAnalysis from "./pages/product-analysis";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Define your route here */}
          {/* <Route path="/" element={<LandingPage />} />
          <Route path="/skincare-chatbot" element={<SkinchateChatbot />} />
          <Route
            path="/routine-recommendations"
            element={<RoutineRecommendations />}
          />
          <Route path="/landing-page" element={<LandingPage />} />
          <Route path="/product-analysis" element={<ProductAnalysis />} />
          <Route path="*" element={<NotFound />} /> */}
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
