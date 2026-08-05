import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is treated as fresh for 30 seconds, so navigating around does not trigger a
      // refetch storm.
      staleTime: 30_000,

      // Do not retry a 404 or a 400 several times - those will not fix themselves, and the
      // default of 3 just delays showing the user the real error.
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
