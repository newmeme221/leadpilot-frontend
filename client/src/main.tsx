import { createRoot } from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import "./index.css";

createRoot(document.getElementById("root")!).render(
        <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                        <App />
                </BrowserRouter>
        </QueryClientProvider>
);
