// src/features/auth/pages/PasswordRecoveryPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import PasswordRecoveryForm from "../components/PasswordRecoveryForm";
import * as authService from "../services/authService";
import "../css/Auth.css";
import Stetic2 from "/Stetic2.svg";

function PasswordRecoveryPage() {
  const [step, setStep] = useState("request"); // 'request' or 'reset'
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestSubmit = async (formData) => {
    setIsLoading(true);
    setError("");
    try {
      await authService.solicitarRecuperacionAPI(formData.email);
      setEmail(formData.email);
      setStep("reset");
      Swal.fire({
        title: "¡Revisa tu correo!",
        text: "Hemos enviado un código de 6 dígitos a tu correo electrónico.",
        icon: "success",
        confirmButtonText: "Entendido",
      });
    } catch (err) {
      setError(err.message || "Ocurrió un error al solicitar la recuperación.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (formData) => {
    setIsLoading(true);
    setError("");
    try {
      await authService.resetearContrasenaAPI({
        ...formData,
        correo: email,
      });
      Swal.fire({
        title: "¡Contraseña actualizada!",
        text: "Tu contraseña ha sido actualizada exitosamente.",
        icon: "success",
        confirmButtonText: "Ir a Iniciar Sesión",
      }).then(() => {
        navigate("/login");
      });
    } catch (err) {
      if (err.message && err.message.includes("inválido")) {
        setError("Código de recuperación inválido, expirado o correo incorrecto.");
      } else if (err.errors) {
        // Handle validation errors from express-validator
        const errorMessages = Object.values(err.errors).map(e => e.msg).join(' ');
        setError(errorMessages);
      }
      else {
        setError(err.message || "Ocurrió un error al restablecer la contraseña.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-box">
        <img src={Stetic2} alt="Logo" className="auth-form-logo" />
        <h2 className="auth-form-title">
          {step === "request" ? "Recuperar Contraseña" : "Restablecer Contraseña"}
        </h2>
        <PasswordRecoveryForm
          step={step}
          onSubmit={step === "request" ? handleRequestSubmit : handleResetSubmit}
          error={error}
          isLoading={isLoading}
          email={email}
        />
      </div>
    </div>
  );
}

export default PasswordRecoveryPage;
