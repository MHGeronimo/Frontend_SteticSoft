import React, { useState, useEffect, useCallback } from "react";

// Importación de todos nuestros componentes
import AbastecimientoTable from "../components/AbastecimientoTable";
import AbastecimientoCrearModal from "../components/AbastecimientoCrearModal";
import AbastecimientoEditarModal from "../components/AbastecimientoEditarModal";
import AbastecimientoDetalleModal from "../components/AbastecimientoDetailsModal";
import DepleteProductModal from "../components/DepleteProductModal";
import ConfirmModal from "../../../shared/components/common/ConfirmModal";
import ValidationModal from "../../../shared/components/common/ValidationModal";
import Pagination from "../../../shared/components/common/Pagination";

// Importación de todas las funciones del servicio
import {
    fetchAbastecimientos,
    deleteAbastecimientoById,
    toggleAbastecimientoEstado,
    agotarAbastecimiento,
} from "../hooks/useAbastecimiento";
import "../css/Abastecimiento.css";

function ListaAbastecimientoPage() {
    // Todos los estados se mantienen igual
    const [abastecimientos, setAbastecimientos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
    const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isRazonAgotamientoOpen, setIsRazonAgotamientoOpen] = useState(false);
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [validationMessage, setValidationMessage] = useState("");
    const [currentAbastecimiento, setCurrentAbastecimiento] = useState(null);

    // La función para cargar datos no cambia
    const loadAbastecimientos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const estadoParam = filtroEstado === 'todos' ? undefined : filtroEstado === 'activos';
            const params = { page: currentPage, limit: itemsPerPage, search: busqueda, estado: estadoParam };
            
            const result = await fetchAbastecimientos(params);
            setAbastecimientos(Array.isArray(result.data) ? result.data : []);
            setTotalItems(result.totalItems || 0);
        } catch (err) {
            console.error("Error al cargar los abastecimientos:", err);
            setError("No se pudieron cargar los registros. Inténtalo de nuevo.");
            setAbastecimientos([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, busqueda, filtroEstado]);

    useEffect(() => {
        loadAbastecimientos();
    }, [loadAbastecimientos]);

    // --- MANEJADORES DE ACCIONES ---

    const handleOpenModal = (type, item = null) => {
        setCurrentAbastecimiento(item);
        if (type === 'create') setIsCrearModalOpen(true);
        if (type === 'details') setIsDetailsModalOpen(true);
        if (type === 'edit') setIsEditarModalOpen(true);
        if (type === 'delete') setIsConfirmDeleteOpen(true);
        if (type === 'deplete') setIsRazonAgotamientoOpen(true);
    };
    
    const handleCloseAllModals = () => {
        setIsCrearModalOpen(false);
        setIsEditarModalOpen(false);
        setIsDetailsModalOpen(false);
        setIsConfirmDeleteOpen(false);
        setIsRazonAgotamientoOpen(false);
        setIsValidationModalOpen(false);
        setCurrentAbastecimiento(null);
    };

    const handleSaveSuccess = (message = "Operación exitosa.") => {
        handleCloseAllModals();
        setValidationMessage(message);
        setIsValidationModalOpen(true);
        loadAbastecimientos(); // Recargar los datos
    };
    
    const handleToggleEstado = async (item) => {
        try {
            await toggleAbastecimientoEstado(item.idAbastecimiento, !item.estado);
            handleSaveSuccess("Estado actualizado exitosamente.");
        } catch (error) {
            handleCloseAllModals();
            setValidationMessage(error.response?.data?.message || "Error al cambiar el estado.");
            setIsValidationModalOpen(true);
        }
    };

    const handleDelete = async () => {
        if (!currentAbastecimiento) return;
        try {
            await deleteAbastecimientoById(currentAbastecimiento.idAbastecimiento);
            handleSaveSuccess("Registro eliminado exitosamente.");
        } catch (error) {
            handleCloseAllModals();
            setValidationMessage(error.response?.data?.message || "Error al eliminar el registro.");
            setIsValidationModalOpen(true);
        }
    };

    const handleAgotarSubmit = async (id, razon) => {
        try {
            await agotarAbastecimiento(id, razon);
            handleSaveSuccess("El producto ha sido marcado como agotado.");
        } catch (error) {
            handleCloseAllModals();
            setValidationMessage(error.response?.data?.message || "Error al marcar como agotado.");
            setIsValidationModalOpen(true);
        }
    };
    
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;

    return (
        <div className="abastecimiento-page-container">
            <div className="abastecimiento-main-content">
                <div className="abastecimiento-content-wrapper">
                    <h1>Gestión de Abastecimiento</h1>
                    <div className="abastecimiento-actions-bar">
                        <div className="abastecimiento-search-bar">
                            <input
                                type="text"
                                placeholder="Buscar por empleado, producto..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="abastecimiento-filtro-estado">
                            <select
                                className="abastecimiento-filtro-estado-select"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                disabled={loading}
                            >
                                <option value="todos">Todos los Estados</option>
                                <option value="activos">Activos</option>
                                <option value="inactivos">Inactivos</option>
                            </select>
                        </div>
                        <button
                            className="abastecimiento-add-button"
                            onClick={() => handleOpenModal('create')}
                            disabled={loading}
                        >
                            Agregar Abastecimiento
                        </button>
                    </div>

                    {loading ? <p>Cargando registros...</p> : error ? <p className="error-message">{error}</p> : (
                        <>
                            <AbastecimientoTable
                                abastecimientos={abastecimientos}
                                startIndex={indexOfFirstItem}
                                onView={(item) => handleOpenModal('details', item)}
                                onEdit={(item) => handleOpenModal('edit', item)}
                                onDeplete={(item) => handleOpenModal('deplete', item)}
                                onDeleteConfirm={(item) => handleOpenModal('delete', item)}
                                onToggleEstado={handleToggleEstado}
                            />
                            <Pagination
                                itemsPerPage={itemsPerPage}
                                totalItems={totalItems}
                                paginate={(pageNumber) => setCurrentPage(pageNumber)}
                                currentPage={currentPage}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* --- RENDERIZADO DE TODOS LOS MODALES --- */}

            <AbastecimientoCrearModal
                isOpen={isCrearModalOpen}
                onClose={handleCloseAllModals}
                onSaveSuccess={() => handleSaveSuccess("Abastecimiento(s) creado(s) exitosamente.")}
            />

            <AbastecimientoEditarModal
                isOpen={isEditarModalOpen}
                onClose={handleCloseAllModals}
                onSaveSuccess={() => handleSaveSuccess("Registro actualizado exitosamente.")}
                initialData={currentAbastecimiento}
            />

            <AbastecimientoDetalleModal
                isOpen={isDetailsModalOpen}
                onClose={handleCloseAllModals}
                abastecimiento={currentAbastecimiento}
            />

            <DepleteProductModal
                isOpen={isRazonAgotamientoOpen}
                onClose={handleCloseAllModals}
                onSubmit={handleAgotarSubmit}
                abastecimiento={currentAbastecimiento}
            />

            {/* ✅ MODAL DE CONFIRMACIÓN CORREGIDO */}
            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={handleCloseAllModals}
                onConfirm={handleDelete}
                title="Confirmar Eliminación"
                message={`¿Está seguro de eliminar el registro para ${currentAbastecimiento?.usuario?.empleadoInfo?.nombre || 'el empleado'} (${currentAbastecimiento?.usuario?.correo || ''})?`}
            />
            
            <ValidationModal
                isOpen={isValidationModalOpen}
                onClose={handleCloseAllModals}
                title="Aviso del Sistema"
                message={validationMessage}
            />
        </div>
    );
}

export default ListaAbastecimientoPage;