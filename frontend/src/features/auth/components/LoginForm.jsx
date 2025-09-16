// src/features/auth/components/LoginForm.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/Auth.css";
import "../css/LoginStyles.css"; // Asegúrate que esta sea la importación correcta

function LoginForm({ onSubmit, error }) {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    setIsCheckboxChecked(e.target.checked);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      alert("Por favor, completa tu correo electrónico y contraseña.");
      return;
    }
    onSubmit(credentials, isCheckboxChecked);
  };

  const RequiredAsterisk = () => <span style={{ color: "red" }}>*</span>;

  return (
    <form className="auth-form-content" onSubmit={handleSubmit}>
      {/* Campo Correo Electrónico */}
      <div className="auth-form-group">
        <label htmlFor="login-email">Correo electrónico <RequiredAsterisk /></label>
        <input
          type="email"
          id="login-email"
          name="email"
          placeholder="ejemplo@correo.com"
          value={credentials.email}
          onChange={handleChange}
          className="auth-form-input"
          required
          autoComplete="email" // <--- ATRIBUTO AÑADIDO/SUGERIDO
        />
      </div>

      {/* Campo Contraseña */}
      <div className="auth-form-group">
        <label htmlFor="login-password">Contraseña <RequiredAsterisk /></label>
        <input
          type="password"
          id="login-password"
          name="password"
          placeholder="Tu contraseña"
          value={credentials.password}
          onChange={handleChange}
          className="auth-form-input"
          required
          autoComplete="current-password" // <--- ATRIBUTO AÑADIDO/SUGERIDO
        />
      </div>

      {/* Checkbox Recordar Usuario */}
      <div className="auth-form-checkbox">
        <input
          type="checkbox"
          id="remember-user"
          checked={isCheckboxChecked}
          onChange={handleCheckboxChange}
        />
        <label htmlFor="remember-user">Recordar usuario</label>
      </div>

      {error && <p className="auth-form-error">{error}</p>}

      <div className="auth-form-actions">
        <button type="submit" className="auth-primary-button">
          Entrar
        </button>
        <Link to="/" className="auth-secondary-button">
          Regresar
        </Link>
      </div>
    </form>
  );
}

export default LoginForm;