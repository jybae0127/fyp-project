
import NotFound from "../pages/NotFound";
import Home from "../pages/home/home";
import Dashboard from "../pages/dashboard/page";

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
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
