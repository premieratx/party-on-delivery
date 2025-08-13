import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AdminLogin } from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import RequireAdmin from "./components/admin/RequireAdmin";
import Index from "./pages/Index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
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