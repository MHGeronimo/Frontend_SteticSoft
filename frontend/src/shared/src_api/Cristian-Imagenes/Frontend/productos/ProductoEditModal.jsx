// ProductoEditModal.jsx
import React from 'react';
import { Modal, Box, Typography } from '@mui/material';
import ProductoFormulario from './ProductoFormulario'; // Asegúrate que esta ruta sea correcta

/**
 * @function ProductoEditModal
 * @description Modal para editar un producto existente.
 * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Controla la visibilidad del modal.
 * @param {function} props.onClose - Función para cerrar el modal.
 * @param {Object} props.initialData - Datos del producto a editar.
 * @param {function} props.onProductoUpdated - Callback al actualizar un producto exitosamente.
 * @param {Array<Object>} props.productos - Lista de productos existentes (para validación de nombres duplicados, si aplica).
 */
export default function ProductoEditModal({ isOpen, onClose, initialData, onProductoUpdated, productos }) {
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

const handleSave = (formData) => { // Aceptar FormData como parámetro
    console.log("ProductoEditModal: Pasando FormData a onProductoUpdated:", formData);
    onProductoUpdated(formData); // Pasamos el FormData directamente
    onClose();
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
                    Editar Producto
                </Typography>
                <ProductoFormulario
                    mode="edit"
                    initialData={initialData}
                    onClose={onClose}
                    onSave={handleSave}
                    productos={productos} // Pasa la lista de productos para validación
                />
            </Box>
        </Modal>
    );
}
