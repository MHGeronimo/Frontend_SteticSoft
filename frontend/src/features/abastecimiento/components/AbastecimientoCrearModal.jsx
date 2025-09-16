import React, { useState, useEffect, useCallback } from 'react';
import AbastecimientoForm from './AbastecimientoForm';
import { fetchEmpleados, createAbastecimiento } from '../hooks/useAbastecimiento';
import { fetchProductosConFiltros } from '../services/productosService'; 
import ItemSelectionModal from '../../../shared/components/common/ItemSelectionModal';
import '../css/Abastecimiento.css';

const AbastecimientoCrearModal = ({ isOpen, onClose, onSaveSuccess }) => {
    
    const getInitialFormState = () => ({
        empleado: null,
        productos: [],
    });

    const [formData, setFormData] = useState(getInitialFormState());
    const [formErrors, setFormErrors] = useState({});
    const [generalError, setGeneralError] = useState('');

    const [isEmpleadoModalOpen, setIsEmpleadoModalOpen] = useState(false);
    const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);
    
    const [empleados, setEmpleados] = useState([]);
    const [productosDisponibles, setProductosDisponibles] = useState([]);

    const loadRequiredData = useCallback(async () => {
        try {
            setGeneralError('');
            // Se inician ambas peticiones a la API en paralelo para mayor eficiencia
            const empleadosPromise = fetchEmpleados();
            const productosPromise = fetchProductosConFiltros({ 
                tipoUso: 'interno', 
                estado: true 
            });

            // Esperar a que ambas promesas se resuelvan
            const [empleadosData, productosData] = await Promise.all([
                empleadosPromise,
                productosPromise,
            ]);

            setEmpleados(empleadosData || []);
            setProductosDisponibles(productosData || []);

        } catch (error) {
            setGeneralError('No se pudieron cargar los datos necesarios.');
            console.error("Error cargando datos para abastecimiento:", error);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadRequiredData();
            setFormData(getInitialFormState());
            setFormErrors({});
            setGeneralError('');
        }
    }, [isOpen, loadRequiredData]);

    const empleadosParaSeleccion = Array.isArray(empleados) ? empleados.map(emp => ({
        ...emp,
        displayName: `${emp.nombre || ''} ${emp.apellido || ''} (${emp.correo || 'N/A'})`
    })) : [];

    const handleEmpleadoSelect = (empleado) => {
        setFormData(prev => ({ ...prev, empleado: empleado }));
        setIsEmpleadoModalOpen(false);
        if (formErrors.empleado) setFormErrors(prev => ({ ...prev, empleado: '' }));
    };

    const handleProductoSelect = (producto) => {
        setFormData(prev => {
            const yaExiste = prev.productos.some(p => p.idProducto === producto.idProducto);
            if (yaExiste) return prev;
            return {
                ...prev,
                productos: [...prev.productos, { ...producto, cantidad: 1 }]
            };
        });
        setIsProductoModalOpen(false);
        if (formErrors.productos) setFormErrors(prev => ({ ...prev, productos: '' }));
    };

    const handleRemoveProducto = (idProducto) => {
        setFormData(prev => ({
            ...prev,
            productos: prev.productos.filter(p => p.idProducto !== idProducto)
        }));
    };

    const handleCantidadChange = (idProducto, cantidad) => {
        const cant = Math.max(1, Number(cantidad) || 1);
        setFormData(prev => ({
            ...prev,
            productos: prev.productos.map(p => 
                p.idProducto === idProducto ? { ...p, cantidad: cant } : p
            )
        }));
    };
    
    const validateForm = () => {
        const errors = {};
        if (!formData.empleado) {
            errors.empleado = 'Debe seleccionar un empleado.';
        }
        if (formData.productos.length === 0) {
            errors.productos = 'Debe seleccionar al menos un producto.';
        } else {
            let productoError = null;
            formData.productos.forEach(p => {
                if (productoError) return;
                if (!p.cantidad || p.cantidad <= 0) {
                    productoError = `El producto "${p.nombre}" debe tener una cantidad válida.`;
                }
                if (p.cantidad > p.existencia) {
                    productoError = `Stock insuficiente para "${p.nombre}". Solicitado: ${p.cantidad}, Disponible: ${p.existencia}.`;
                }
            });
            if(productoError) errors.productos = productoError;
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError("");
        if (!validateForm()) {
            setGeneralError("Por favor, corrija los errores en el formulario.");
            return;
        }

        try {
            const promesasCreacion = formData.productos.map(producto => {
                const dataParaAPI = {
                    idUsuario: formData.empleado.id_usuario,
                    idProducto: producto.idProducto,
                    cantidad: producto.cantidad,
                };
                return createAbastecimiento(dataParaAPI);
            });

            await Promise.all(promesasCreacion);
            
            onSaveSuccess();
            onClose();

        } catch (error) {
            console.error("Error al crear abastecimiento(s):", error);
            setGeneralError(error.response?.data?.message || 'Ocurrió un error al guardar.');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-abastecimiento-overlay">
                <div className="modal-abastecimiento-content formulario-modal">
                    <button type="button" className="modal-close-button-x" onClick={onClose}>&times;</button>
                    <h2 className="abastecimiento-modal-title">Registrar Nuevo Abastecimiento</h2>
                    <AbastecimientoForm
                        formData={formData}
                        formErrors={formErrors}
                        onEmpleadoSelect={() => setIsEmpleadoModalOpen(true)}
                        onProductoSelect={() => setIsProductoModalOpen(true)}
                        onRemoveProducto={handleRemoveProducto}
                        onCantidadChange={handleCantidadChange}
                    />
                    {generalError && <p className="error-abastecimiento" style={{ textAlign: 'center', marginTop: '15px' }}>{generalError}</p>}
                    <div className="form-actions-abastecimiento">
                        <button type="button" className="form-button-cancelar-abastecimiento" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="button" className="form-button-guardar-abastecimiento" onClick={handleSubmit}>
                            Guardar Abastecimiento
                        </button>
                    </div>
                </div>
            </div>

            {isEmpleadoModalOpen && (
                <ItemSelectionModal
                    isOpen={isEmpleadoModalOpen}
                    onClose={() => setIsEmpleadoModalOpen(false)}
                    onSelectItem={handleEmpleadoSelect}
                    items={empleadosParaSeleccion}
                    title="Seleccionar Empleado"
                    searchPlaceholder="Buscar empleado por correo..."
                    itemKey="id_usuario"
                    itemName="displayName"
                />
            )}
            {isProductoModalOpen && (
                <ItemSelectionModal
                    isOpen={isProductoModalOpen}
                    onClose={() => setIsProductoModalOpen(false)}
                    onSelectItem={handleProductoSelect}
                    items={productosDisponibles}
                    title="Seleccionar Producto"
                    searchPlaceholder="Buscar producto por nombre..."
                    itemKey="idProducto"
                    itemName="nombre"
                />
            )}
        </>
    );
};

export default AbastecimientoCrearModal;