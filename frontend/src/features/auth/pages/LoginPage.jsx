// src/features/auth/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// Corregido: Importamos el hook personalizado useAuth
import { useAuth } from "../../../shared/contexts/authHooks"; // Path updated
import LoginForm from "../components/LoginForm";
import "../css/Auth.css";
import "../css/LoginStyles.css";

function LoginPage() {
  const navigate = useNavigate();
  // Corregido: Usamos el hook useAuth() para obtener la función de login
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (credentials, rememberMe) => {
    setError("");
    setIsLoading(true);
    try {
      const loginResult = await login(credentials, rememberMe);

      if (loginResult.success) {
        // Redirección basada en el rol
        if (loginResult.role === "Administrador" || loginResult.role === "Empleado") {
          navigate("/admin/dashboard");
        } else if (loginResult.role === "Cliente") {
          navigate("/");
        } else {
          navigate("/"); // Ruta por defecto
        }
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-box">
        <img src="/logo.png" alt="SteticSoft Logo" className="auth-form-logo" />
        <h2 className="auth-form-title">Iniciar Sesión</h2>
        <LoginForm onSubmit={handleLoginSubmit} error={error} isLoading={isLoading} />
        <div className="auth-form-actions">
          <Link to="/password-recovery" className="auth-secondary-button">
            ¿Olvidaste tu contraseña?
          </Link>
          <Link to="/register" className="auth-secondary-button">
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;