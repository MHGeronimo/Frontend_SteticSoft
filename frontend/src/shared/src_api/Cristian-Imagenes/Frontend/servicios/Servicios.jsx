// Servicios.jsx
import React, { useState, useEffect } from "react";
import { authenticatedFetch } from '../../utils/apiClient.js';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, IconButton, Typography, TextField, Pagination, Stack, InputAdornment,
    Switch
} from "@mui/material";
import {
    Search as SearchIcon, Delete as DeleteIcon, Edit as EditIcon,
    Visibility as Eye, Add as AddIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

// Importar LocalizationProvider y el adaptador de fechas
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Importar los componentes modales (asegúrate de que estas rutas son correctas en tu proyecto)
import ServicioCreateModal from './ServicioCreateModal';
import ServicioEditModal from './ServicioEditModal';
import ServicioViewModal from './ServicioViewModal';

const API_BASE_URL = 'http://localhost:3000/api'; // Asegúrate de que esta sea la URL correcta de tu backend
const ITEMS_PER_PAGE = 5;

export default function ServiciosAgregados() {
    const [servicios, setServicios] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [loading, setLoading] = useState(false); // Este loading es solo para la carga INICIAL de la tabla
    const [error, setError] = useState(null); // Este error es solo para la carga INICIAL de la tabla
    const navigate = useNavigate();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [currentServicio, setCurrentServicio] = useState(null); // currentServicio ahora solo para Edit/View

    const [searchQuery, setSearchQuery] = useState('');

    // Estado para las categorías
    const [categorias, setCategorias] = useState([]);

    /**
     * @function fetchServicios
     * @description Obtiene la lista de servicios desde la API.
     * Controla si se muestra una pantalla de carga global.
     * @param {boolean} showGlobalLoading - Si es true, activa el estado de carga global.
     */
    const fetchServicios = async (showGlobalLoading = true) => {
        if (showGlobalLoading) {
            setLoading(true);
            setError(null);
        }
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/servicios`, {
                method: 'GET',
            });

            if (response.status === 401) {
                setError('Unauthorized: Your session has expired. Please log in again.');
                if (showGlobalLoading) setLoading(false);
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error al obtener servicios (fetchServicios):", errorData); // Added for debugging
                throw new Error(errorData.mensaje || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Asegura que los datos sean un array, manejando data.data o solo data
            setServicios(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
        } catch (e) {
            console.error("Error al obtener los servicios:", e);
            setError('Error al cargar los servicios: ' + e.message);
            setServicios([]);
        } finally {
            if (showGlobalLoading) {
                setLoading(false);
            }
        }
    };

    // useEffect para cargar los servicios al montar el componente (con carga global inicial)
    useEffect(() => {
        fetchServicios();
    }, [navigate]);

    // useEffect para cargar las categorías al montar el componente
    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/cat_servicios`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        console.warn('Servicios.jsx: No autorizado para cargar categorías. Redirigiendo a login.');
                        navigate('/login');
                        return;
                    }
                    const errorData = await response.json();
                    console.error("Error al obtener categorías (fetchCategorias):", errorData); // Added for debugging
                    throw new Error(errorData.mensaje || `HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                // Mapea y filtra solo las activas
                const categoriasActivas = Array.isArray(data.data)
                    ? data.data
                        .filter(cat => Number(cat.estadoAI) === 1) // Solo categorías activas
                        .map(cat => ({
                            CodigoCat: cat.CodigoCatS, // Propiedad correcta para ID de categoría
                            nombre: cat.Nombre, // Propiedad correcta para nombre de categoría
                            descripcion: cat.Descripcion,
                            estadoAI: cat.estadoAI
                        }))
                    : [];
                setCategorias(categoriasActivas);
            } catch (e) {
                console.error("Error al obtener categorías de servicios:", e);
                setCategorias([]);
            }
        };
        fetchCategorias();
    }, [navigate]);

    // Manejador para el cambio en el input de búsqueda
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
        setPagina(1); // Resetear a la primera página cuando cambia la búsqueda
    };

    // Lógica para filtrar servicios basada en el searchQuery
    const filteredServices = servicios.filter(servicio => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const servicioEstadoText = Number(servicio.estadoAI) === 1 ? 'activo' : 'inactivo';

        // Si la consulta de búsqueda está vacía, mostrar todos los servicios
        if (lowerCaseQuery.length === 0) {
            return true;
        }

        // Si la consulta es específicamente 'activo' o 'inactivo', filtrar solo por estado
        if (lowerCaseQuery === 'activo') {
            return servicioEstadoText === 'activo';
        }
        if (lowerCaseQuery === 'inactivo') {
            return servicioEstadoText === 'inactivo';
        }

        // Para cualquier otra consulta, buscar en todos los campos relevantes (incluyendo el estado textual)
        const matchesNombre = servicio.nombre && servicio.nombre.toLowerCase().includes(lowerCaseQuery);
        const matchesDuracion = servicio.duracion && servicio.duracion.toLowerCase().includes(lowerCaseQuery);
        const matchesPrecio = servicio.precio !== undefined && servicio.precio !== null &&
                              String(Number(servicio.precio).toFixed(2)).includes(lowerCaseQuery);
        // Si la búsqueda no es "activo" o "inactivo" exactos, permitimos búsquedas parciales en el texto del estado
        const matchesPartialEstado = servicioEstadoText.includes(lowerCaseQuery);

        return matchesNombre || matchesDuracion || matchesPrecio || matchesPartialEstado;
    });

    // CÁLCULO DE LA PAGINACIÓN
    const pageCount = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
    const indexOfLastItem = pagina * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentServices = filteredServices.slice(indexOfFirstItem, indexOfLastItem);

    /**
     * @function handleToggleEstado
     * @description Cambia el estado (Activo/Inactivo) de un servicio.
     * Muestra una confirmación con SweetAlert2 y actualiza la UI sin recarga global.
     * @param {number} id - ID del servicio a actualizar.
     */
    const handleToggleEstado = async (id) => {
        const servicioToUpdate = servicios.find(servicio => servicio.ID_Servicio === id);
        if (servicioToUpdate) {
            const result = await Swal.fire({
                title: '¿Está seguro de cambiar el estado de este servicio?',
                text: 'Esta acción modificará el estado del servicio.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#a1005b',
                cancelButtonColor: '#888',
                confirmButtonText: 'Sí, cambiar',
                cancelButtonText: 'Cancelar',
                customClass: { popup: 'swal2-zindex-fix' }
            });

            if (!result.isConfirmed) {
                return; // El usuario canceló
            }

            try {
                const currentEstadoAI = Number(servicioToUpdate.estadoAI);
                const newEstadoAI = currentEstadoAI === 1 ? 0 : 1;

                // Asegúrate de que el payload coincida exactamente con lo que espera tu validador de backend para PUT
                const payload = {
                    ID_Servicio: servicioToUpdate.ID_Servicio, // Es crucial enviar el ID para que el backend sepa qué servicio actualizar
                    estadoAI: newEstadoAI
                };

                const response = await fetch(`${API_BASE_URL}/servicios/${id}/estado`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        setError('Unauthorized: Your session has expired. Please log in again.');
                        navigate('/login');
                        return;
                    }
                    const errorData = await response.json();
                    console.error("Backend error data (Servicios.jsx - handleToggleEstado):", errorData); // Added for debugging
                    throw new Error(errorData.mensaje || `HTTP error! status: ${response.status}`);
                }
                const updatedServiceData = await response.json();
                setServicios(prevServicios =>
                    prevServicios.map(servicio =>
                        servicio.ID_Servicio === id ? (updatedServiceData.data || updatedServiceData) : servicio
                    )
                );

                Swal.fire({
                    icon: 'success',
                    title: '¡Estado cambiado!',
                    text: 'El estado del servicio se cambió correctamente.',
                    confirmButtonColor: '#a1005b',
                    customClass: { popup: 'swal2-zindex-fix' }
                });

            } catch (e) {
                console.error("Error al actualizar el estado del servicio:", e);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al actualizar el estado del servicio: ' + e.message,
                    confirmButtonColor: '#a1005b',
                    customClass: { popup: 'swal2-zindex-fix' }
                });
            }
        }
    };

    const openCreateModal = () => setIsCreateModalOpen(true);
    const closeCreateModal = () => setIsCreateModalOpen(false);

    const openEditModal = (servicio) => {
        setCurrentServicio(servicio);
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => {
        setCurrentServicio(null);
        setIsEditModalOpen(false);
    };

    const openViewModal = (servicio) => {
        setCurrentServicio(servicio);
        setIsViewModalOpen(true);
    };
    const closeViewModal = () => {
        setCurrentServicio(null);
        setIsViewModalOpen(false);
    };

/**
 * @function handleCreateServicio
 * @description Maneja la creación de un nuevo servicio.
 * Llama a la API y refresca la lista de servicios sin la pantalla de carga global.
 * @param {Object} nuevoServicioData - Datos del nuevo servicio.
 */
const handleCreateServicio = async (nuevoServicioData) => {
    try {
        // ✅ Eliminar la lógica de 'isFormData' y 'headers' y usar un solo 'body'
        // Esto simplifica el código y delega la gestión del Content-Type a la función `authenticatedFetch`.
        const body = nuevoServicioData;
        
        console.log("Servicios.jsx: Enviando solicitud de creación a la API.");
        console.log("Es FormData?:", body instanceof FormData);

        // ✅ Usar la función `authenticatedFetch` para la llamada a la API
        const response = await authenticatedFetch(`${API_BASE_URL}/servicios`, {
            method: 'POST',
            body: body, // El body puede ser FormData o JSON.stringify()
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error al crear el servicio (backend):", errorData);
            throw new Error(errorData.mensaje || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Servicio creado con éxito:", data);
        await fetchServicios(false);
        setIsCreateModalOpen(false);
        Swal.fire({
            icon: 'success',
            title: '¡Servicio creado!',
            text: 'El servicio se creó correctamente.',
            confirmButtonColor: '#a1005b',
            customClass: { popup: 'swal2-zindex-fix' }
        });
    } catch (e) {
        console.error("Error al crear el servicio:", e);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al crear el servicio: ' + (e.message || 'Error desconocido'),
            confirmButtonColor: '#a1005b',
            customClass: { popup: 'swal2-zindex-fix' }
        });
    }
};

/**
 * @function handleUpdateServicio
 * @description Maneja la actualización de un servicio usando la función centralizada.
 * @param {Object|FormData} updatedServicioData - Los datos del servicio a actualizar.
 */
const handleUpdateServicio = async (updatedServicioData) => {
    try {
        let serviceIdToUpdate;
        let body;
        
        // ✅ Determina si el cuerpo de la petición es FormData o un objeto JSON
        if (updatedServicioData instanceof FormData) {
            // Si es FormData, usa el método .get() para obtener el ID
            serviceIdToUpdate = updatedServicioData.get('ID_Servicio');
            body = updatedServicioData;
        } else {
            // Si es un objeto JSON, accede a la propiedad directamente
            serviceIdToUpdate = updatedServicioData.ID_Servicio;
            body = JSON.stringify(updatedServicioData);
        }

        console.log("Servicios.jsx: Enviando solicitud de actualización a la API para el ID:", serviceIdToUpdate);
        console.log("Es FormData?:", updatedServicioData instanceof FormData);

        const response = await authenticatedFetch(`${API_BASE_URL}/servicios/${serviceIdToUpdate}`, {
            method: 'PUT',
            body: body,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error al actualizar servicio (backend):", errorData);
            throw new Error(errorData.mensaje || `Error al actualizar servicio: ${response.status}`);
        }
        
        await fetchServicios(false);
        setIsEditModalOpen(false);
        Swal.fire({
            icon: 'success',
            title: '¡Servicio actualizado!',
            text: 'El servicio se actualizó correctamente.',
            confirmButtonColor: '#a1005b',
            customClass: { popup: 'swal2-zindex-fix' }
        });

    } catch (e) {
        console.error("Error al actualizar el servicio:", e);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al actualizar el servicio: ' + e.message,
            confirmButtonColor: '#a1005b',
            customClass: { popup: 'swal2-zindex-fix' }
        });
    }
};

    /**
     * @function handleDeleteServicio
     * @description Maneja la eliminación de un servicio.
     * Muestra una confirmación con SweetAlert2, elimina el servicio y ajusta la paginación.
     * @param {number} id - ID del servicio a eliminar.
     */
    const handleDeleteServicio = async (id) => {
        const result = await Swal.fire({
            title: '¿Está seguro de eliminar este servicio?',
            text: 'Esta acción no se puede revertir.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#a1005b',
            cancelButtonColor: '#888',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'swal2-zindex-fix' }
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            console.log("Servicios.jsx: Intentando eliminar servicio con ID:", id);
            const response = await fetch(`${API_BASE_URL}/servicios/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!response.ok) {
                if (response.status === 401) {
                    setError('Unauthorized: Your session has expired. Please log in again.');
                    navigate('/login');
                    return;
                }
                const errorData = await response.json();
                console.error("Backend error data (Servicios.jsx - handleDeleteServicio):", errorData); // Added for debugging
                throw new Error(errorData.mensaje || `HTTP error! status: ${response.status}`);
            }

            // Actualizar la lista de servicios localmente primero para calcular la nueva paginación
            const updatedServicios = servicios.filter(s => s.ID_Servicio !== id);
            setServicios(updatedServicios); // Actualizar el estado de servicios

            // Calcular la nueva paginación después de la eliminación
            const newFilteredLength = updatedServicios.filter(s =>
                s.nombre && s.nombre.toLowerCase().includes(searchQuery.toLowerCase())
            ).length;
            const newPageCount = Math.ceil(newFilteredLength / ITEMS_PER_PAGE);

            // Ajustar la página si es necesario (mover a la página anterior si la actual queda vacía)
            if (pagina > newPageCount && newPageCount > 0) {
                setPagina(newPageCount);
            } else if (newPageCount === 0) {
                setPagina(1); // Si no quedan servicios, ir a la página 1 (que estará vacía)
            }

            Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El servicio fue eliminado correctamente.',
                confirmButtonColor: '#a1005b',
                customClass: { popup: 'swal2-zindex-fix' }
            });

        } catch (e) {
            console.error("Error al eliminar el servicio:", e);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al intentar eliminar el servicio. Por favor, inténtelo de nuevo.',
                confirmButtonColor: '#a1005b',
                customClass: { popup: 'swal2-zindex-fix' }
            });
        }
    };

    // La pantalla de carga global solo se muestra para la carga inicial o si hay un error crítico
    if (loading) {
        return <div style={{ textAlign: 'center', padding: '20px' }}>Cargando servicios...</div>;
    }

    if (error) {
        return <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
             <div style={{ padding: "24px", maxWidth: "auto", margin: "0 20px 0 100px", minHeight: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <Typography variant="h4" gutterBottom sx={{ color: '#a1005b', fontWeight: "bold" }}>
                        Servicios
                    </Typography>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <TextField
                        label="Buscar..."
                        variant="outlined"
                        size="small"
                        sx={{ ml: 1, width: 250, backgroundColor: 'white', borderRadius: '6px' }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            )
                        }}
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />

                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: "#a1005b",
                            color: "#fff",
                            fontSize: "16px",
                            fontWeight: "bold",
                            textTransform: "none",
                            "&:hover": { backgroundColor: "#b0256b" }
                        }}
                        onClick={openCreateModal}
                    >
                        <AddIcon sx={{ mr: 0.5 }} /> Agregar Servicio
                    </Button>
                </div>

                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: "bold" }}>Nombre</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Duración</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Precio</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentServices.map((servicio) => (
                                <TableRow key={servicio.ID_Servicio}>
                                    <TableCell>{servicio.nombre}</TableCell>
                                    <TableCell>{servicio.duracion}</TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat('es-CO', {
                                            style: 'currency',
                                            currency: 'COP',
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        }).format(servicio.precio)}
                                    </TableCell>
                                    <TableCell>
                                        <Typography style={{ color: Number(servicio.estadoAI) === 1 ? "green" : "red" }}>
                                            {Number(servicio.estadoAI) === 1 ? "Activo" : "Inactivo"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <Switch
                                                checked={Number(servicio.estadoAI) === 1}
                                                onChange={() => handleToggleEstado(servicio.ID_Servicio)}
                                                color="success"
                                            />
                                            <IconButton onClick={() => openViewModal(servicio)}><Eye /></IconButton>
                                            {/* Deshabilitar Editar y Eliminar si el servicio está Inactivo (estadoAI === 0) */}
                                            <IconButton
                                                onClick={() => openEditModal(servicio)}
                                                disabled={Number(servicio.estadoAI) === 0}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleDeleteServicio(servicio.ID_Servicio)}
                                                disabled={Number(servicio.estadoAI) === 0}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Pagination
                    count={pageCount}
                    page={pagina}
                    onChange={(e, value) => setPagina(value)}
                    sx={{ display: "flex", justifyContent: "center", marginTop: "16px" }}
                />

                <ServicioCreateModal
                    isOpen={isCreateModalOpen}
                    onClose={closeCreateModal}
                    onServicioCreated={handleCreateServicio}
                    servicios={servicios}
                    categorias={categorias}
                />
                <ServicioEditModal
                    isOpen={isEditModalOpen}
                    onClose={closeEditModal}
                    initialData={currentServicio}
                    onServicioUpdated={handleUpdateServicio}
                    servicios={servicios}
                    categorias={categorias}
                />

                <ServicioViewModal
                    isOpen={isViewModalOpen}
                    onClose={closeViewModal}
                    initialData={currentServicio}
                    categorias={categorias}
                />

            </div>
        </LocalizationProvider>
    );
}
