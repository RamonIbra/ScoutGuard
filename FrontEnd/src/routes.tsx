import { RouteObject } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PlayerDiscoveryPage from "./pages/PlayerDiscoveryPage";
import DefensiveMetricsPage from "./pages/DefensiveMetricsPage";
import ChatPage from "./pages/ChatPage";
import ProtectedRoute from "./components/ui/ProtectedRoute";

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />, //Tillgänglig för alla
      },
      {
        path: "/discovery",
        element: <ProtectedRoute element={<PlayerDiscoveryPage />} />,
      },
      {
        path: "/metrics",
        element: <ProtectedRoute element={<DefensiveMetricsPage />} />,
      },
      {
        path: "/chat",
        element: <ProtectedRoute element={<ChatPage />} />,
      },
    ],
  },
];

export default routes;
