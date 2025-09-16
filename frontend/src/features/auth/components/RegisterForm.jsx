// src/features/auth/components/RegisterForm.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/Auth.css"; // Estilos comunes
import "../css/RegisterStyles.css"; // Estilos específicos del registro

function RegisterForm({ onSubmit, error, successMessage, isLoading }) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    telefono: "",
    tipoDocumento: "",
    numeroDocumento: "",
    fechaNacimiento: "",
    direccion: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    for (const key in formData) {
      if (Object.prototype.hasOwnProperty.call(formData, key) && formData[key] === "") {
        let fieldName = key;
        switch (key) {
          case "nombre": fieldName = "Nombre"; break;
          case "apellido": fieldName = "Apellido"; break;
          case "correo": fieldName = "Correo Electrónico"; break;
          case "contrasena": fieldName = "Contraseña"; break;
          case "telefono": fieldName = "Teléfono"; break;
          case "tipoDocumento": fieldName = "Tipo de Documento"; break;
          case "numeroDocumento": fieldName = "Número de Documento"; break;
          case "fechaNacimiento": fieldName = "Fecha de Nacimiento"; break;
          case "direccion": fieldName = "Dirección"; break;
          default: break;
        }
        setFormError(`Por favor, completa el campo: ${fieldName}`);
        return;
      }
    }
    if (!confirmPassword) {
      setFormError("Por favor, confirma tu contraseña.");
      return;
    }
    if (formData.contrasena !== confirmPassword) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }
    if (formData.contrasena.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!isCheckboxChecked) {
      setFormError("Debes aceptar los términos y condiciones.");
      return;
    }
    onSubmit(formData);
  };

  // Componente para el asterisco rojo
  const RequiredAsterisk = () => <span style={{ color: "red" }}>*</span>;

  return (
    <form className="auth-form-content" onSubmit={handleSubmit}>
      <div className="auth-form-grid">
        {/* Campo Nombre */}
        <div className="auth-form-group">
          <label htmlFor="nombre">Nombre completo <RequiredAsterisk /></label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            placeholder="Ej: Ana"
            value={formData.nombre}
            onChange={handleChange}
            className="auth-form-input"
            required
          />
        </div>

        {/* Campo Apellido */}
        <div className="auth-form-group">
          <label htmlFor="apellido">Apellidos <RequiredAsterisk /></label>
          <input
            type="text"
            id="apellido"
            name="apellido"
            placeholder="Ej: Pérez López"
            value={formData.apellido}
            onChange={handleChange}
            className="auth-form-input"
            required
          />
        </div>

        {/* Campo Correo Electrónico */}
        <div className="auth-form-group">
          <label htmlFor="correo">Correo electrónico <RequiredAsterisk /></label>
          <input
            type="email"
            id="correo"
            name="correo"
            placeholder="ejemplo@correo.com"
            value={formData.correo}
            onChange={handleChange}
            className="auth-form-input"
            required
          />
        </div>

        {/* Campo Contraseña */}
        <div className="auth-form-group">
          <label htmlFor="contrasena">Contraseña <RequiredAsterisk /></label>
          <input
            type="password"
            id="contrasena"
            name="contrasena"
            placeholder="Mínimo 8 caracteres"
            value={formData.contrasena}
            onChange={handleChange}
            className="auth-form-input"
            required
            minLength="8"
          />
        </div>

        {/* Campo Confirmar Contraseña */}
        <div className="auth-form-group">
          <label htmlFor="confirmPassword">Confirmar Contraseña <RequiredAsterisk /></label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-form-input"
            required
            minLength="8"
          />
        </div>

        {/* Campo Teléfono */}
        <div className="auth-form-group">
          <label htmlFor="telefono">Teléfono <RequiredAsterisk /></label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            placeholder="Ej: 3001234567"
            value={formData.telefono}
            onChange={handleChange}
            className="auth-form-input"
            required
          />
        </div>

        {/* Campo Tipo de Documento */}
        <div className="auth-form-group">
          <label htmlFor="tipoDocumento">Tipo de Documento <RequiredAsterisk /></label>
          <select
            id="tipoDocumento"
            name="tipoDocumento"
            value={formData.tipoDocumento}
            onChange={handleChange}
            className="auth-form-input"
            required
          >
            <option value="" disabled>Selecciona un tipo...</option>
            <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
            <option value="Cédula de Extranjería">Cédula de Extranjería</option>
          </select>
        </div>

        {/* Campo Número de Documento */}
        <div className="auth-form-group">
          <label htmlFor="numeroDocumento">Número de Documento <RequiredAsterisk /></label>
          <input
            type="text"
            id="numeroDocumento"
            name="numeroDocumento"
            placeholder="Ej: 1020304050"
            value={formData.numeroDocumento}
            onChange={handleChange}
            className="auth-form-input"
            required
          />
        </div>

        {/* Campo Fecha de Nacimiento */}
        <div className="auth-form-group">
          <label htmlFor="fechaNacimiento">Fecha de Nacimiento <RequiredAsterisk /></label>
          <input
            type="date"
            id="fechaNacimiento"
            name="fechaNacimiento"
            value={formData.fechaNacimiento}
            onChange={handleChange}
            className="auth-form-input"
            required
            // Puedes añadir max y min date si es necesario
            // max={new Date().toISOString().split("T")[0]} // Ejemplo: no permitir fechas futuras
          />
        </div>

        {/* Campo Dirección */}
        <div className="auth-form-group">
          <label htmlFor="direccion">Dirección <RequiredAsterisk /></label>
          <input
            type="text"
            id="direccion"
            name="direccion"
            placeholder="Ej: Calle 5 # 4-3"
            value={formData.direccion}
            onChange={handleChange}
            className="auth-form-input"
            required
          />
        </div>
      </div>

      <div className="auth-form-bottom-section">
        <div className="auth-form-checkbox">
          <input
            type="checkbox"
            id="terms-check" // El label ya tiene htmlFor="terms-check"
            checked={isCheckboxChecked}
            onChange={(e) => setIsCheckboxChecked(e.target.checked)}
            required
          />
          <label htmlFor="terms-check">Acepto los términos y condiciones <RequiredAsterisk /></label>
        </div>

        {formError && <p className="auth-form-error">{formError}</p>}
        {error && <p className="auth-form-error">{error}</p>}
        {successMessage && (
          <p className="auth-form-success">{successMessage}</p>
        )}

        <div className="auth-form-actions">
          <button type="submit" className="auth-primary-button" disabled={isLoading}>
            {isLoading ? "Registrando..." : "Registrarse"}
          </button>
          <Link to="/" className="auth-secondary-button">
            Regresar
          </Link>
        </div>
      </div>
    </form>
  );
}

export default RegisterForm;