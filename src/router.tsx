import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AdminLogin } from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import RequireAdmin from "./components/admin/RequireAdmin";
import { HomeHero } from "./routes/home/HomeHero";
import { HomeHealthCheck } from "./routes/home/HomeHealthCheck";

// Home component
const Home = () => (
  <div>
    <HomeHero />
    <HomeHealthCheck />
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/affiliate/admin-login",
    element: <AdminLogin />,
  },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminDashboard />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <RequireAdmin>
        <AdminDashboard />
      </RequireAdmin>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export const Router = () => <RouterProvider router={router} />;