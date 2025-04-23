// src/index.js

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CookiesProvider } from "react-cookie";
import { PremiumProvider } from "./context/PremiumContext";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

 const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <CookiesProvider>
    <PremiumProvider>
      <BrowserRouter>
        <React.StrictMode>
         <App />
       </React.StrictMode>
      </BrowserRouter>
   </PremiumProvider>
 </CookiesProvider>
);
