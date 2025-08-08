import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Voice from "./components/Voice";
import Chat from "./components/Chat";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

let allRoutes = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/voice",
    element: <Voice />,
  },
  {
    path: "/chat",
    element: <Chat />,
  },
]);
root.render(
  <React.StrictMode>
    <RouterProvider router={allRoutes} />
  </React.StrictMode>
);
