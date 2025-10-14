// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline, StyledEngineProvider } from "@mui/material";
import App from "./App";
import theme from "./theme/themes"; // 👈 tu theme
import "./index.css";
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* asegura que tus estilos de MUI se inyecten primero */}
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
