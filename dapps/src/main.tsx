import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { QueryClient } from "@tanstack/react-query";
import { EveFrontierProvider } from "@evefrontier/dapp-kit";
import App from "./App";
import { BigShotProvider } from "./context/BigShotContext";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EveFrontierProvider queryClient={queryClient}>
      <BigShotProvider>
        <App />
      </BigShotProvider>
    </EveFrontierProvider>
  </React.StrictMode>,
);
