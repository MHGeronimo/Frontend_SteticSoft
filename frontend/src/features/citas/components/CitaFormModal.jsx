// src/features/citas/components/CitaFormModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import CitaForm from './CitaForm';
import {
  // ✅ CORRECCIÓN: Nombres de funciones actualizados para coincidir con citasService.js
  fetchServiciosDisponiblesParaCitas,
  fetchEmpleadosDisponiblesParaCitas, // Se usará cuando se tenga una novedad
  fetchClientesParaCitas,
} from '../services/citasService';
import ItemSelectionModal from '../../../shared/components/common/ItemSelectionModal';

// El modal ahora necesita saber la novedad para buscar empleados
const CitaFormModal = ({ isOpen, onClose, onSubmit, initialSlotData, clientePreseleccionado, novedadId }) => {
  const [formData, setFormData] = useState({});
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [empleadosDisponibles, setEmpleadosDisponibles] = useState([]);
  const [clientesList, setClientesList] = useState([]);
  const [showClienteSelectModal, setShowClienteSelectModal] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);

  // Cargar dependencias (Servicios y Empleados si hay novedad)
  useEffect(() => {
    if (isOpen) {
      setIsLoadingDependencies(true);
      setError('');

      const promises = [
        fetchServiciosDisponiblesParaCitas(),
        // ✅ CORRECCIÓN: Solo buscamos empleados si tenemos una novedadId para la cita
        novedadId ? fetchEmpleadosDisponiblesParaCitas(novedadId) : Promise.resolve({ data: { data: [] } })
      ];

      Promise.all(promises).then(([serviciosRes, empleadosRes]) => {
        const servicios = serviciosRes.data?.data || [];
        const empleados = empleadosRes.data?.data || [];

        setServiciosDisponibles(servicios);
        setEmpleadosDisponibles(empleados);
        
        // Inicializar formulario (lógica existente adaptada)
        let idInit = initialSlotData?.id || null;
        let clienteInit = clientePreseleccionado || initialSlotData?.cliente || null;
        let empleadoIdInit = initialSlotData?.empleadoId || null;
        let servicioIdsInit = initialSlotData?.servicios?.map(s => s.idServicio) || initialSlotData?.serviciosProgramados?.map(s => s.idServicio) || [];
        let estadoCitaIdInit = initialSlotData?.idEstado || 1;
        let startTimeInit = initialSlotData?.start || initialSlotData?.fechaHora || null;
        let endTimeInit = initialSlotData?.end || null;

        // Si no hay hora de fin, se calcula basado en los servicios iniciales
        if (startTimeInit && !endTimeInit && servicioIdsInit.length > 0) {
            const duracionTotal = servicios
                .filter(s => servicioIdsInit.includes(s.idServicio))
                .reduce((total, s) => total + (s.duracionEstimadaMin || 30), 0);
            endTimeInit = moment(startTimeInit).add(duracionTotal, 'minutes').toDate();
        }

        setFormData({
          id: idInit,
          cliente: clienteInit,
          clienteId: clienteInit?.idCliente || null,
          empleadoId: empleadoIdInit,
          servicioIds: servicioIdsInit,
          start: startTimeInit,
          end: endTimeInit,
          estadoCitaId: estadoCitaIdInit,
          novedadId: novedadId, // Guardamos la novedad
        });

      }).catch(err => {
        console.error("Error cargando dependencias:", err);
        setError("Error al cargar datos necesarios: " + (err.response?.data?.message || err.message));
      }).finally(() => {
        setIsLoadingDependencies(false);
      });
    }
  }, [isOpen, initialSlotData, clientePreseleccionado, novedadId]);

  // Lógica para buscar clientes
  const handleClienteSearch = (term) => {
    if (term.length > 2) {
        fetchClientesParaCitas(term).then(res => {
            setClientesList(res.data?.data || []);
        });
    }
  };

  const clientesParaModal = useMemo(() => {
    return clientesList.map(c => ({
      ...c,
      value: c.idCliente,
      label: `${c.nombre} ${c.apellido || ''}`.trim()
    }));
  }, [clientesList]);
  
  // Lógica de envío del formulario
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    // Validaciones básicas del front-end
    if (!formData.clienteId) { setError("Debe seleccionar un cliente."); return; }
    if (!formData.empleadoId) { setError("Debe seleccionar un empleado."); return; }
    if (!formData.servicioIds || formData.servicioIds.length === 0) { setError("Debe seleccionar al menos un servicio."); return; }
    if (!formData.start) { setError("No se ha definido una hora de inicio."); return; }

    setError('');
    setIsLoading(true);

    // ✅ CORRECCIÓN: Se prepara el objeto final para la API
    const dataToSend = {
      id: formData.id,
      fechaHora: moment(formData.start).toISOString(),
      clienteId: formData.clienteId,
      usuarioId: formData.empleadoId,
      servicios: formData.servicioIds,
      estadoCitaId: formData.estadoCitaId,
      novedadId: formData.novedadId
    };

    try {
      await onSubmit(dataToSend);
    } catch (submissionError) {
      setError(submissionError.message || "Error al guardar la cita.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // El resto del componente JSX se mantiene mayormente igual
  if (!isOpen) return null;

  return (
    <div className="modal-citas">
      <div className="modal-content-citas">
        <button className="cerrar-modal" onClick={onClose} disabled={isLoading}>&times;</button>
        <h3>{formData.id ? 'Editar Cita' : 'Agendar Nueva Cita'}</h3>

        {isLoadingDependencies ? (
          <div className="cargando-modal">Cargando datos...</div>
        ) : (
          <form onSubmit={handleSubmitForm}>
            <CitaForm
              formData={formData}
              setFormData={setFormData} // Pasamos la función para que el hijo pueda actualizar
              onEmpleadoChange={(e) => setFormData(prev => ({ ...prev, empleadoId: parseInt(e.target.value) }))}
              empleadosDisponibles={empleadosDisponibles}
              serviciosDisponibles={serviciosDisponibles}
            />

            <div className="form-group">
              <label htmlFor="clienteSearch">Cliente <span className="required-asterisk">*</span>:</label>
              <input
                type="text"
                className="buscar-cliente-input"
                value={formData?.cliente ? `${formData.cliente.nombre} ${formData.cliente.apellido || ''}`.trim() : ''}
                onClick={() => setShowClienteSelectModal(true)}
                placeholder="Seleccionar cliente"
                readOnly
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            <div className="botonesModalCitas">
              <button type="submit" disabled={isLoading || isLoadingDependencies}>
                {isLoading ? "Guardando..." : (formData.id ? "Actualizar Cita" : "Guardar Cita")}
              </button>
              <button type="button" onClick={onClose} disabled={isLoading}>Cancelar</button>
            </div>
          </form>
        )}
      </div>

      <ItemSelectionModal
        isOpen={showClienteSelectModal}
        onClose={() => setShowClienteSelectModal(false)}
        title="Seleccionar Cliente"
        items={clientesParaModal}
        onSearch={handleClienteSearch}
        onSelectItem={(selectedItem) => { 
          setFormData({ ...formData, cliente: selectedItem, clienteId: selectedItem.idCliente }); 
          setShowClienteSelectModal(false); 
        }}
        searchPlaceholder="Buscar cliente por nombre..."
      />
    </div>
  );
};

export default CitaFormModal;