// src/features/citas/pages/AgendarCitaPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

// Importa los servicios necesarios
import { 
    fetchNovedades, 
    fetchClientesParaCitas, 
    fetchServiciosDisponiblesParaCitas, 
    saveCita 
} from '../services/citasService';

// Importa los estilos específicos para esta página
import '../css/Citas.css';

// Nota: El registro del idioma 'es' para el calendario se movió a tu archivo principal (main.jsx) para evitar errores.

const AgendarCitaPage = () => {
    const navigate = useNavigate();

    // Estados para datos de la API
    const [novedades, setNovedades] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [servicios, setServicios] = useState([]);

    // Estados para el flujo del formulario
    const [novedadSeleccionada, setNovedadSeleccionada] = useState(null);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
    const [horaSeleccionada, setHoraSeleccionada] = useState(null);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
    
    // Estados para UI
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Carga de datos inicial
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setIsLoading(true);
                const [novedadesData, clientesData, serviciosData] = await Promise.all([
                    fetchNovedades(),
                    fetchClientesParaCitas(),
                    fetchServiciosDisponiblesParaCitas()
                ]);
                setNovedades(novedadesData);
                setClientes(clientesData);
                setServicios(serviciosData);
            } catch (err) {
                setError('Error al cargar los datos necesarios para agendar. ' + err.message);
            } finally {
                setIsLoading(false);
            }
        };
        cargarDatos();
    }, []);

    // Opciones formateadas para los Selectores
    const opcionesNovedades = useMemo(() => novedades.map(n => ({
        label: `Horario del ${moment(n.fechaInicio).format('DD/MM/YYYY')} al ${moment(n.fechaFin).format('DD/MM/YYYY')}`,
        value: n.idNovedad,
        novedadCompleta: n
    })), [novedades]);

    const opcionesClientes = useMemo(() => clientes.map(c => ({
        label: `${c.nombre} ${c.apellido || ''} (${c.numeroDocumento || 'N/A'})`,
        value: c.idCliente
    })), [clientes]);

    const opcionesEmpleados = useMemo(() => 
        novedadSeleccionada?.empleados.map(e => ({
            label: e.nombre,
            value: e.id
        })) || [], 
    [novedadSeleccionada]);

    const opcionesServicios = useMemo(() => servicios.map(s => ({
        label: `${s.nombre} - $${Number(s.precio).toLocaleString('es-CO')}`,
        value: s.id
    })), [servicios]);

    // Lógica para el Calendario
    const diasPermitidosNumeros = useMemo(() => {
        if (!novedadSeleccionada) return [];
        const diasMap = { "Domingo": 0, "Lunes": 1, "Martes": 2, "Miércoles": 3, "Jueves": 4, "Viernes": 5, "Sábado": 6 };
        return novedadSeleccionada.dias.map(nombreDia => diasMap[nombreDia]).filter(dia => dia !== undefined);
    }, [novedadSeleccionada]);

    const filtrarDiasDisponibles = (date) => {
        const diaDeLaSemana = moment(date).day();
        return diasPermitidosNumeros.includes(diaDeLaSemana);
    };

    // Lógica para generar Horas
    const horasDisponibles = useMemo(() => {
        if (!novedadSeleccionada) return [];
        const horas = [];
        let tiempoActual = moment(novedadSeleccionada.horaInicio, 'HH:mm:ss');
        const tiempoFin = moment(novedadSeleccionada.horaFin, 'HH:mm:ss');
        while (tiempoActual.isBefore(tiempoFin)) {
            horas.push(tiempoActual.format('HH:mm'));
            tiempoActual.add(60, 'minutes');
        }
        return horas;
    }, [novedadSeleccionada]);
    
    // Manejo del envío del formulario
    const handleAgendarCita = async () => {
        setError('');
        if (!novedadSeleccionada || !fechaSeleccionada || !horaSeleccionada || !clienteSeleccionado || !empleadoSeleccionado || serviciosSeleccionados.length === 0) {
            setError('Por favor, complete todos los pasos antes de agendar.');
            return;
        }

        setIsSubmitting(true);

        const citaData = {
            fecha: moment(fechaSeleccionada).format('YYYY-MM-DD'), // Envía solo la fecha
            hora_inicio: horaSeleccionada,                       // Envía solo la hora
            clienteId: clienteSeleccionado.value,
            usuarioId: empleadoSeleccionado.value,
            idEstado: 5, // Usamos el ID del estado por defecto 'Pendiente' o 'Programada'
            novedadId: novedadSeleccionada.idNovedad,
            servicios: serviciosSeleccionados.map(s => s.value),
        };

        // Depuración: Verifica en la consola lo que estás enviando
        console.log("➡️ Payload definitivo para la API:", JSON.stringify(citaData, null, 2));
        try {
            await saveCita(citaData);
            alert('¡Cita agendada con éxito!');
            navigate('/admin/citas'); // Redirige a la lista de citas
        } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        const validationErrors = err.response?.data?.errors;
        let detailedError = errorMessage;

        if (validationErrors) {
            detailedError += "\n" + Object.entries(validationErrors)
          .map(([field, messages]) => `- ${field}: ${messages.join(', ')}`)
          .join("\n");
        }
        setError(`Error al guardar la cita: ${detailedError}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="cargando-pagina">Cargando...</div>;

    return (
        <div className="agendar-cita-container">
            <h1>Agendar Nueva Cita</h1>
            <div className="agendar-cita-form">
                
                <div className="form-step">
                    <label>1. Selecciona una Novedad de Horario</label>
                    <Select
                        options={opcionesNovedades}
                        onChange={opcion => {
                            setNovedadSeleccionada(opcion.novedadCompleta);
                            setFechaSeleccionada(null);
                            setHoraSeleccionada(null);
                            setEmpleadoSeleccionado(null);
                        }}
                        placeholder="Busca o selecciona un rango de fechas..."
                        noOptionsMessage={() => "No hay novedades de horario disponibles."}
                    />
                </div>

                {novedadSeleccionada && (
                    <div className="form-step">
                        <label>2. Elige una Fecha</label>
                        <div className="datepicker-wrapper">
                            <DatePicker
                                selected={fechaSeleccionada}
                                onChange={(date) => {
                                    setFechaSeleccionada(date);
                                    setHoraSeleccionada(null);
                                }}
                                minDate={moment(novedadSeleccionada.fechaInicio).toDate()}
                                maxDate={moment(novedadSeleccionada.fechaFin).toDate()}
                                filterDate={filtrarDiasDisponibles}
                                locale="es"
                                inline
                            />
                        </div>
                    </div>
                )}

                {fechaSeleccionada && (
                    <div className="form-step">
                        <label>3. Elige un Horario</label>
                        <div className="horas-grid">
                            {horasDisponibles.length > 0 ? (
                                horasDisponibles.map(hora => (
                                    <button 
                                        key={hora} 
                                        className={`hora-btn ${horaSeleccionada === hora ? 'selected' : ''}`}
                                        onClick={() => setHoraSeleccionada(hora)}
                                    >
                                        {moment(hora, 'HH:mm').format('hh:mm A')}
                                    </button>
                                ))
                            ) : (
                                <p>No hay horas disponibles para esta novedad.</p>
                            )}
                        </div>
                    </div>
                )}
                
                {horaSeleccionada && (
                    <>
                        <div className="form-step">
                            <label>4. Busca y Selecciona el Cliente</label>
                            <Select options={opcionesClientes} onChange={setClienteSeleccionado} value={clienteSeleccionado} placeholder="Escribe para buscar un cliente..." />
                        </div>
                        <div className="form-step">
                            <label>5. Selecciona el Empleado</label>
                            <Select options={opcionesEmpleados} onChange={setEmpleadoSeleccionado} value={empleadoSeleccionado} placeholder="Elige un empleado..." />
                        </div>
                        <div className="form-step">
                            <label>6. Selecciona los Servicios</label>
                            <Select options={opcionesServicios} isMulti onChange={setServiciosSeleccionados} value={serviciosSeleccionados} placeholder="Elige uno o más servicios..." />
                        </div>
                    </>
                )}
                
                <div className="form-step-submit">
                    {error && <p className="error-message">{error}</p>}
                    <button onClick={handleAgendarCita} disabled={isSubmitting || !horaSeleccionada}>
                        {isSubmitting ? 'Agendando...' : 'Revisar y Agendar Cita'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgendarCitaPage;