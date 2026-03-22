import React from "react";
import ReactDOM from "react-dom/client";
import "@radix-ui/themes/styles.css";
import "./index.css";
import { Theme } from "@radix-ui/themes";
import { QueryClient } from "@tanstack/react-query";
import { EveFrontierProvider } from "@evefrontier/dapp-kit";
import App from "./App";
import { BigShotProvider } from "./context/BigShotContext";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme appearance="dark" accentColor="blue" grayColor="slate" panelBackground="solid" radius="none">
      <EveFrontierProvider queryClient={queryClient}>
        <BigShotProvider>
          <App />
        </BigShotProvider>
      </EveFrontierProvider>
    </Theme>
  </React.StrictMode>,
);
