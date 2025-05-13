import { Navigate, useLocation } from "react-router-dom";

function CheckAuth({ isAuthenticated, user, children }) {
  const location = useLocation();
  
  // Define paths that don't require authentication
  const publicPaths = ["/login", "/register"];
  const isPublicPath = publicPaths.some(path => location.pathname.includes(path));
  
  // Handle root path redirects
  if (location.pathname === "/") {
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" />;
    } else {
      return <Navigate to={user?.role === "admin" ? "/admin/new-dashboard" : "/shop/home"} />;
    }
  }
  
  // Allow access to public paths (login/register) regardless of auth status
  if (isPublicPath) {
    // Only redirect authenticated users away from auth pages if they try to access them directly
    if (isAuthenticated) {
      return <Navigate to={user?.role === "admin" ? "/admin/new-dashboard" : "/shop/home"} />;
    }
    // Allow unauthenticated users to access public paths
    return <>{children}</>;
  }
  
  // Protect non-public paths from unauthenticated users
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }
  
  // Role-based access control for authenticated users
  if (user?.role !== "admin" && location.pathname.includes("/admin")) {
    return <Navigate to="/unauth-page" />;
  }
  
  if (user?.role === "admin" && location.pathname.includes("/shop")) {
    return <Navigate to="/admin/new-dashboard" />;
  }
  
  // If all checks pass, render the children
  return <>{children}</>;
}

export default CheckAuth;