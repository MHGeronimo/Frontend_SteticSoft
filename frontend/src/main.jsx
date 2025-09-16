import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { registerLocale, setDefaultLocale } from 'react-datepicker';
import es from 'date-fns/locale/es'; // Importa el paquete de idioma español

// Registra el idioma español para que el calendario sepa cómo usarlo
registerLocale('es', es);
setDefaultLocale('es');

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
