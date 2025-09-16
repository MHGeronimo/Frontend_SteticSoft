// Ubicación: src/features/categoriasServicioAdmin/pages/ListaCategoriasServicioPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import CategoriasTabla from '../components/CategoriasServicioTable';
import CategoriaForm from '../components/CategoriaServicioForm.jsx';
import CategoriaServicioDetalleModal from '../components/CategoriaServicioDetalleModal';

// --- Estilos ---
import '../css/CategoriasServicio.css';
import {
  getCategoriasServicio,
  createCategoriaServicio,
  updateCategoriaServicio,
  deleteCategoriaServicio,
  cambiarEstadoCategoriaServicio,
} from '../services/categoriasServicioService.js';

const MySwal = withReactContent(Swal);

const ListaCategoriasServicioPage = () => {
  // --- Estados del componente ---
  const [categorias, setCategorias] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // --- Estados para la paginación ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  // --- Estados para los modales ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [categoriaActual, setCategoriaActual] = useState(null);

  // --- Lógica de carga de datos ---
  const cargarCategorias = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getCategoriasServicio();
      const data = response?.data?.data || response?.data || [];
      setCategorias(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al cargar categorías.');
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);
  
  // --- Lógica de filtrado y paginación combinada ---
  const categoriasFiltradas = useMemo(() => {
    let dataFiltrada = [...categorias];

    if (filtroEstado !== 'todos') {
      const esActivo = filtroEstado === 'activos';
      dataFiltrada = dataFiltrada.filter(cat => cat.estado === esActivo);
    }

    if (terminoBusqueda.trim() !== '') {
  const busquedaNormalizada = terminoBusqueda
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  dataFiltrada = dataFiltrada.filter(cat => {
    const nombreNormalizado = cat.nombre
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") || '';

    const descripcionNormalizada = cat.descripcion
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") || '';

    const estadoTexto = cat.estado ? 'activo' : 'inactivo';

    return (
      nombreNormalizado.includes(busquedaNormalizada) ||
      descripcionNormalizada.includes(busquedaNormalizada) ||
      estadoTexto.includes(busquedaNormalizada)
    );
  });
}
return dataFiltrada;

  }, [categorias, terminoBusqueda, filtroEstado]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return categoriasFiltradas.slice(startIndex, endIndex);
  }, [currentPage, rowsPerPage, categoriasFiltradas]);
  
  const totalPages = Math.ceil(categoriasFiltradas.length / rowsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };


  // --- Manejadores de Acciones ---
  const handleAbrirCrearModal = () => {
    setIsEditMode(false);
    setCategoriaActual(null);
    setIsFormModalOpen(true);
  };

  const handleAbrirEditarModal = (categoria) => {
    setIsEditMode(true);
    setCategoriaActual(categoria);
    setIsFormModalOpen(true);
  };
  
  const handleVerDetalles = (categoria) => {
    setCategoriaActual(categoria);
    setIsDetailModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setLoadingId(isEditMode ? categoriaActual.idCategoriaServicio : "create");
    try {
      if (isEditMode) {
        await updateCategoriaServicio(
          categoriaActual.idCategoriaServicio,
          formData
        );
      } else {
        await createCategoriaServicio(formData);
      }
      MySwal.fire({
        title: "¡Éxito!",
        text: `Categoría ${
          isEditMode ? "actualizada" : "creada"
        } exitosamente.`,
        icon: "success",
      });
      setIsFormModalOpen(false);
      cargarCategorias();
    } catch (err) {
      MySwal.fire({
        title: "Error",
        text:
          err?.response?.data?.message ||
          `Error al ${isEditMode ? "actualizar" : "crear"} la categoría.`,
        icon: "error",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleEliminarCategoria = (categoria) => {
    MySwal.fire({
      title: "¿Estás seguro?",
      html: `Deseas eliminar la categoría <strong>"${categoria.nombre}"</strong>? <br/>¡Esta acción no se puede deshacer!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, ¡eliminar!",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoadingId(categoria.idCategoriaServicio);
        try {
          await deleteCategoriaServicio(categoria.idCategoriaServicio);
          MySwal.fire(
            "¡Eliminada!",
            "La categoría ha sido eliminada.",
            "success"
          );
          cargarCategorias();
        } catch (err) {
          MySwal.fire(
            "Error",
            err?.response?.data?.message || "Error al eliminar la categoría.",
            "error"
          );
        } finally {
          setLoadingId(null);
        }
      }
    });
  };

  const handleSolicitarCambioEstadoCategoria = (categoria) => {
    MySwal.fire({
      title: "Confirmar Acción",
      html: `¿Estás seguro de que deseas ${
        categoria.estado ? "desactivar" : "activar"
      } la categoría <strong>"${categoria.nombre}"</strong>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Sí, ${
        categoria.estado ? "desactivar" : "activar"
      }`,
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoadingId(categoria.idCategoriaServicio);
        try {
          await cambiarEstadoCategoriaServicio(
            categoria.idCategoriaServicio,
            !categoria.estado
          );
          MySwal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Estado cambiado exitosamente",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          cargarCategorias();
        } catch (err) {
          MySwal.fire(
            "Error",
            err?.response?.data?.message || "Error al cambiar estado.",
            "error"
          );
        } finally {
          setLoadingId(null);
        }
      }
    });
  };

  return (
    <div className="Categoria-content">
      <div className="categorias-servicio-content-wrapper">
        <h1>Gestión de Categorías de Servicio</h1>

        <div className="ContainerBotonAgregarCategoria">
          <div className="filtros-wrapper">
            <input
              className="filtro-input"
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={terminoBusqueda}
              onChange={(e) => {
                setTerminoBusqueda(e.target.value);
                setCurrentPage(1);
              }}
            />
            <div className="filtro-estado-grupo">
                <select
                  id="filtro-estado"
                  className="filtro-input-estados"
                  value={filtroEstado}
                  onChange={(e) => {
                    setFiltroEstado(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                </select>
            </div>
          </div>

          <button className="botonAgregarCategoria" onClick={handleAbrirCrearModal}>
            Agregar Nueva Categoría
          </button>
        </div>

        {error && <p className="error" style={{textAlign: 'center', width: '100%'}}>ERROR: {error}</p>}

        {loading ? (
          <p>Cargando categorías...</p>
        ) : (
          <>
            <CategoriasTabla
              categorias={paginatedData} 
              onEditar={handleAbrirEditarModal}
              onEliminar={handleEliminarCategoria}
              onCambiarEstado={handleSolicitarCambioEstadoCategoria}
              onVerDetalles={handleVerDetalles}
              loadingId={loadingId}
            />

            {/* --- Renderizado de los controles de paginación MODIFICADO --- */}
            {totalPages > 1 && ( // Solo muestra la paginación si hay más de 1 página
              <div className="pagination-container">
                  <div className="rows-per-page-container">
                      <label htmlFor="rows-per-page">Filas por página:</label>
                      <select id="rows-per-page" value={rowsPerPage} onChange={handleRowsPerPageChange}>
                          <option value="5">5</option>
                          <option value="10">10</option>
                      </select>
                  </div>
                  <div className="pagination-controls">
                      {/* Se eliminan los botones "Anterior" y "Siguiente" */}
                      {[...Array(totalPages).keys()].map(num => (
                          <button
                              key={num + 1}
                              onClick={() => handlePageChange(num + 1)}
                              className={currentPage === num + 1 ? 'active' : ''}
                          >
                              {num + 1}
                          </button>
                      ))}
                  </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- Modales --- */}
      <CategoriaForm
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={categoriaActual}
        isEditMode={isEditMode}
      />
      <CategoriaServicioDetalleModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        categoria={categoriaActual}
      />
    </div>
  );
};

export default ListaCategoriasServicioPage;