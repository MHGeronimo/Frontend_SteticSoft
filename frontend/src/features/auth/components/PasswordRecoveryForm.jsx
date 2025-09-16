// src/features/auth/components/PasswordRecoveryForm.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../css/Auth.css";

function PasswordRecoveryForm({ step, onSubmit, error, isLoading, email }) {
  const [formData, setFormData] = useState({
    email: "",
    token: "",
    nuevaContrasena: "",
    confirmarNuevaContrasena: "",
  });

  useEffect(() => {
    if (email) {
      setFormData((prev) => ({ ...prev, email }));
    }
  }, [email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="auth-form-content" onSubmit={handleSubmit}>
      {step === "request" ? (
        <div className="auth-form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="ejemplo@correo.com"
            value={formData.email}
            onChange={handleChange}
            className="auth-form-input"
            required
          />
        </div>
      ) : (
        <>
          <div className="auth-form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              className="auth-form-input"
              disabled
            />
          </div>
          <div className="auth-form-group">
            <label htmlFor="token">Código de 6 dígitos</label>
            <input
              type="text"
              id="token"
              name="token"
              placeholder="123456"
              value={formData.token}
              onChange={handleChange}
              className="auth-form-input"
              required
              maxLength="6"
            />
          </div>
          <div className="auth-form-group">
            <label htmlFor="nuevaContrasena">Nueva Contraseña</label>
            <input
              type="password"
              id="nuevaContrasena"
              name="nuevaContrasena"
              value={formData.nuevaContrasena}
              onChange={handleChange}
              className="auth-form-input"
              required
            />
          </div>
          <div className="auth-form-group">
            <label htmlFor="confirmarNuevaContrasena">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              id="confirmarNuevaContrasena"
              name="confirmarNuevaContrasena"
              value={formData.confirmarNuevaContrasena}
              onChange={handleChange}
              className="auth-form-input"
              required
            />
          </div>
        </>
      )}

      {error && <p className="auth-form-error">{error}</p>}

      <div className="auth-form-actions">
        <button type="submit" className="auth-primary-button" disabled={isLoading}>
          {isLoading
            ? "Procesando..."
            : step === "request"
            ? "Enviar Código"
            : "Restablecer Contraseña"}
        </button>
        <Link to="/login" className="auth-secondary-button">
          Regresar al Login
        </Link>
      </div>
    </form>
  );
}

export default PasswordRecoveryForm;
