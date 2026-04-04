
import NotFound from "../pages/NotFound";
import Home from "../pages/home/Home";
import Dashboard from "../pages/dashboard/page";
import CVAnalysis from "../pages/cv-analysis/page";
import JobRecommendations from "../pages/job-recommendations/page";

const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/cv-analysis",
    element: <CVAnalysis />,
  },
  {
    path: "/job-recommendations",
    element: <JobRecommendations />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
