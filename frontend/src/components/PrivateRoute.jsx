import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

/**
 * Auth guard for /app/* routes.
 * Redirects to /auth if no valid token exists.
 */
const PrivateRoute = ({ children }) => {
  const { isAuthed } = useApp();
  const hasToken = !!localStorage.getItem("barter_token");

  if (!isAuthed && !hasToken) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default PrivateRoute;
