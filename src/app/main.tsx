import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import '../styles.css';

import "@/i18n"

import { getRouter } from "../router";

const router = getRouter();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);