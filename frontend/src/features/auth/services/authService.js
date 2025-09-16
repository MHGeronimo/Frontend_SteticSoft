// src/features/auth/services/authService.js
import apiClient from "../../../shared/services/apiClient"; // apiClient es tu instancia configurada de Axios

/**
 * Realiza la llamada al endpoint de inicio de sesión de la API.
 * Este servicio toma las credenciales del formulario (email y password),
 * transforma los nombres de los campos ('email' a 'correo', 'password' a 'contrasena')
 * para que coincidan con los esperados por el endpoint /auth/login del backend,
 * y envía la solicitud. Maneja la respuesta o los errores de la API.
 * @param {object} credentials - Objeto con las credenciales del usuario: { email: "usuario@example.com", password: "password123" }.
 * @returns {Promise<object>} La respuesta de la API, que típicamente incluye datos del usuario y el token JWT.
 * @throws {Error} Relanza el error si la llamada a la API falla, permitiendo que el llamador lo maneje.
 */
export const loginAPI = async (credentials) => {
  // Transformación de los nombres de los campos del frontend a los esperados por el backend.
  const datosParaAPI = {
    correo: credentials.email,
    contrasena: credentials.password,
  };

  try {
    // Petición POST al endpoint de login del backend.
    const response = await apiClient.post("/auth/login", datosParaAPI);
    return response.data;
  } catch (error) {
    // Es importante relanzar el error para que la capa superior (ej. AuthContext, LoginPage)
    // pueda manejarlo y informar al usuario adecuadamente.
    throw (
      error.response?.data ||
      new Error(error.message || "Error desconocido durante el inicio de sesión.")
    );
  }
};

/**
 * Realiza la llamada al endpoint de registro de nuevos usuarios en la API.
 * Se asume que 'userData' ya contiene todos los campos con los nombres correctos
 * que el backend espera para el registro en /auth/registrar.
 * @param {object} userData - Objeto con todos los datos del usuario para el registro.
 * Ej: { nombre: "Ana", apellido: "Perez", correo: "ana@example.com", ... }.
 * @returns {Promise<object>} La respuesta de la API, usualmente con datos del usuario recién creado y token.
 * @throws {Error} Relanza el error si la llamada a la API falla, permitiendo que el llamador lo maneje.
 */
export const registerAPI = async (userData) => {
  try {
    // Petición POST al endpoint de registro del backend con los datos del usuario.
    const response = await apiClient.post("/auth/registrar", userData);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data ||
      new Error(error.message || "Error desconocido durante el proceso de registro.")
    );
  }
};

/**
 * Realiza la llamada al endpoint para solicitar un token de recuperación de contraseña.
 * @param {string} emailSolicitud - Correo electrónico del usuario.
 * @returns {Promise<object>} La respuesta de la API, generalmente un mensaje de confirmación.
 * @throws {Error} Relanza el error si la llamada a la API falla.
 */
export const solicitarRecuperacionAPI = async (emailSolicitud) => {
  try {
    // Petición POST al backend enviando el correo electrónico.
    const response = await apiClient.post("/auth/solicitar-recuperacion", {
      correo: emailSolicitud, // El backend espera un objeto con la propiedad 'correo'.
    });
    return response.data;
  } catch (error) {
    throw (
      error.response?.data ||
      new Error(error.message || "Error desconocido al solicitar la recuperación de contraseña.")
    );
  }
};

/**
 * Realiza la llamada al endpoint para restablecer la contraseña utilizando un código OTP.
 * @param {object} data - Objeto con los datos para el reseteo.
 * @param {string} data.correo - Correo electrónico del usuario.
 * @param {string} data.token - Código OTP de 6 dígitos.
 * @param {string} data.nuevaContrasena - Nueva contraseña.
 * @param {string} data.confirmarNuevaContrasena - Confirmación de la nueva contraseña.
 * @returns {Promise<object>} La respuesta de la API, generalmente un mensaje de éxito.
 * @throws {Error} Relanza el error si la llamada a la API falla.
 */
export const resetearContrasenaAPI = async (data) => {
  const datosParaAPI = {
    correo: data.correo,
    token: data.token,
    nuevaContrasena: data.nuevaContrasena,
    confirmarNuevaContrasena: data.confirmarNuevaContrasena,
  };
  try {
    const response = await apiClient.post(
      "/auth/resetear-contrasena",
      datosParaAPI
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data ||
      new Error(error.message || "Error desconocido al intentar restablecer la contraseña.")
    );
  }
};

/**
 * Gestiona el proceso de logout del lado del cliente.
 * @returns {Promise<object>} Un objeto indicando el éxito del logout del cliente.
 */
export const logoutAPI = async () => {
  // Si el backend tuviera un endpoint de logout, la llamada iría aquí:
  // await apiClient.post("/auth/logout");
  
  // Se mantiene como 'async' para asegurar que la función siempre retorne una promesa,
  // manteniendo la consistencia con otras llamadas a la API.
  return { success: true, message: "Logout procesado por el cliente." };
};