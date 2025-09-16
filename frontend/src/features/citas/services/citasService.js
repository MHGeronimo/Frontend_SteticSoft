// src/features/citas/services/citasService.js
import apiClient from "../../../shared/services/apiClient";
import moment from "moment";
// Asumo que este import es para obtener la lista de servicios, lo cual es correcto.
import { getServicios } from "../../serviciosAdmin/services/serviciosAdminService";

/**
 * ✅ Obtener todas las citas desde la API
 */
export const fetchCitasAgendadas = async () => {
  try {
    const response = await apiClient.get("/citas");
    const citas = response.data?.data || [];

    // Transformar la data para que sea compatible con el frontend (ej. FullCalendar)
    return citas.map(c => ({
      ...c,
      title: c.cliente?.nombre || 'Cita', // Un título para eventos de calendario
      start: moment(`${c.fecha} ${c.horaInicio}`).toDate(),
      end: moment(`${c.fecha} ${c.horaFin}`).toDate(),
    }));
  } catch (error) {
    console.error("Error al obtener citas:", error);
    throw new Error("No se pudieron cargar las citas agendadas.");
  }
};

/**
 * ✅ Guardar una nueva cita o editar una existente
 */
export const saveCita = async (citaData) => {
  try {
    // El objeto 'citaData' ya viene perfectamente formateado desde la página.
    // Simplemente lo reenviamos.

    // Para CREAR una nueva cita
    if (!citaData.id) {
      // Añadimos un log para confirmar qué está recibiendo el servicio
      console.log("Servicio 'saveCita' (Crear) recibiendo:", citaData);
      
      const response = await apiClient.post("/citas", citaData);
      return response.data.data;
    } 
    // Para EDITAR una cita
    else {
      console.log("Servicio 'saveCita' (Editar) recibiendo:", citaData);

      const response = await apiClient.put(`/citas/${citaData.id}`, citaData);
      return response.data.data;
    }
  } catch (error) {
    console.error("Error en el servicio al guardar cita:", error);
    // Lanza el error completo para que el componente pueda leer los detalles
    throw error;
  }
};

/**
 * ✅ Eliminar cita por ID
 */
export const deleteCitaById = async (citaId) => {
  try {
    await apiClient.delete(`/citas/${citaId}`);
  } catch (error) {
    console.error("Error al eliminar cita:", error);
    throw new Error(error.response?.data?.message || "No se pudo eliminar la cita.");
  }
};

/**
 * ✅ Cambiar estado de una cita
 */
export const cambiarEstadoCita = async (citaId, nuevoEstado, motivo = "") => {
  try {
    const response = await apiClient.patch(`/citas/${citaId}/estado`, {
      estado: nuevoEstado, // El backend puede esperar el nombre o un ID
      motivoCancelacion: motivo,
    });
    return response.data.data;
  } catch (error) {
    console.error("Error al cambiar estado de cita:", error);
    throw new Error(error.response?.data?.message || "No se pudo cambiar el estado de la cita.");
  }
};

/**
 * ✅ Traer servicios disponibles para el formulario de citas
 */
export const fetchServiciosDisponiblesParaCitas = async () => {
  try {
    // Asumo que getServicios() devuelve una estructura { data: { data: [...] } }
    const response = await getServicios({ estado: true });
    return (response?.data?.data || []).map(s => ({
      ...s,
      id: s.idServicio, // Normaliza el ID para el frontend
      nombre: s.nombre,
      precio: parseFloat(s.precio) || 0,
    }));
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    throw new Error("No se pudieron cargar los servicios.");
  }
};

/**
 * ✅ Traer clientes disponibles para el formulario de citas
 */
export const fetchClientesParaCitas = async () => {
  try {
    const response = await apiClient.get("/clientes"); // Asumiendo que esta ruta devuelve todos los clientes
    return response.data?.data || [];
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    throw new Error("No se pudieron cargar los clientes.");
  }
};

/**
 * ✅ NUEVA FUNCIÓN: Traer novedades de horario (agendables)
 */
export const fetchNovedades = async () => {
  try {
    // La ruta debe coincidir con la de tu backend (novedades.routes.js)
    const response = await apiClient.get("/novedades");
    return response.data?.data || [];
  } catch (error) {
    console.error("Error al obtener novedades:", error);
    throw new Error("No se pudieron cargar los horarios disponibles.");
  }
};

/**
 * ✅ Traer empleados disponibles
 */
export const fetchEmpleadosDisponiblesParaCitas = async () => {
  try {
    const response = await apiClient.get("/empleados");
    // El backend devuelve idUsuario, lo mapeamos a 'id' para consistencia en el frontend.
    return (response.data?.data || []).map(emp => ({
        ...emp,
        id: emp.idUsuario 
    }));
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    return [];
  }
};