import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import Landing from "./routes/index";
import Explore from "./routes/explore";
import Auth  from "./routes/auth";
import ForBusiness from "./routes/for-business";
import BusinessDash  from "./routes/business/index";
import AccountPage from "./routes/account/index";
import Admin  from "./routes/admin/index";
import BusinessProfile from "./routes/b.$slug";
import { AuthProvider } from "./lib/auth-context";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/explore", element: <Explore /> },
  { path: "/auth", element: <Auth /> },
  { path: "/for-business", element: <ForBusiness /> },
  { path: "/business", element: <BusinessDash /> },
  { path: "/account", element: <AccountPage /> },
  { path: "/admin", element: <Admin /> },
  { path: "/b/:slug", element: <BusinessProfile /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
