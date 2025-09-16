// ServicioEditModal.jsx
import React from 'react';
import { Modal, Box, Typography } from '@mui/material';
import ServicioForm from './ServicioFormulario'; // Ajusta la ruta si es necesario

/**
 * @function ServicioEditModal
 * @description Modal para editar un servicio existente.
 * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Controla la visibilidad del modal.
 * @param {function} props.onClose - Función para cerrar el modal.
 * @param {Object} props.initialData - Datos del servicio a editar.
 * @param {function} props.onServicioUpdated - Callback al actualizar un servicio exitosamente.
 * @param {Array<Object>} props.servicios - Lista de servicios existentes (para validación de nombres duplicados, si aplica).
 * @param {Array<Object>} props.categorias - Lista de categorías de servicios disponibles.
 */
export default function ServicioEditModal({ isOpen, onClose, initialData, onServicioUpdated, servicios, categorias }) {
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: '70%', md: '50%', lg: '40%' },
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: '10px',
        maxHeight: '90vh',
        overflowY: 'auto'
    };

    const handleSave = (servicioData) => {
        // ✅ CORRECTO: Si servicioData es una instancia de FormData, no la modifiques
        if (servicioData instanceof FormData) {
            // Agrega el ID_Servicio al FormData, ya que no se puede desestructurar
            servicioData.append('ID_Servicio', initialData.ID_Servicio);
            // Llama a la función de actualización con el FormData
            onServicioUpdated(servicioData);
        } else {
            // Si es un objeto JSON, crea una copia y agrega el ID_Servicio
            const updatedDataWithId = { ...servicioData, ID_Servicio: initialData.ID_Servicio };
            // Llama a la función de actualización con el objeto JSON
            onServicioUpdated(updatedDataWithId);
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            aria-labelledby="modal-title-edit"
            aria-describedby="modal-description-edit"
        >
            <Box sx={style}>
                <Typography id="modal-title-edit" variant="h6" component="h2" gutterBottom sx={{ color: '#a1005b', fontWeight: "bold", textAlign: 'center' }}>
                    Editar Servicio
                </Typography>
                <ServicioForm
                    mode="edit"
                    initialData={initialData}
                    onClose={onClose}
                    onSave={handleSave}
                    servicios={servicios}
                    categorias={categorias}
                />
            </Box>
        </Modal>
    );
}
