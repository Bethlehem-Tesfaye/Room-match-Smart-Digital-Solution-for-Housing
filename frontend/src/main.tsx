import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { RentalUnreadCountsProvider } from "./features/dashbord/context/RentalUnreadCountsContext";
import { TenantRentalUnreadCountsProvider } from "./features/rentals/context/TenantRentalUnreadCountsContext";
import { queryClient } from "./lib/reactQuery";
import { initTheme } from "./theme/initTheme";

initTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RentalUnreadCountsProvider>
        <TenantRentalUnreadCountsProvider>
          <App />
        </TenantRentalUnreadCountsProvider>
      </RentalUnreadCountsProvider>
    </QueryClientProvider>
  </StrictMode>,
);
