// Productos.jsx
import React, { useState, useEffect, useCallback } from "react";
import { authenticatedFetch } from '../../utils/apiClient.js';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Typography, TextField, Pagination, Stack, InputAdornment,
    Switch, IconButton, Box, CircularProgress
} from "@mui/material";
import {
    Search as SearchIcon, Delete as DeleteIcon, Edit as EditIcon,
    Visibility as Eye, Add as AddIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2'; // Usando SweetAlert2 para notificaciones

// Importaciones CORRECTAS de los modales del módulo de PRODUCTOS
import ProductoCreateModal from './ProductoCreateModal';
import ProductoEditModal from './ProductoEditModal';
import ProductoViewModal from './ProductoViewModal';

// URL base de la API
const API_BASE_URL = 'http://localhost:3000/api';
const ITEMS_PER_PAGE = 5;

export default function Productos() {
    const [productos, setProductos] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [loading, setLoading] = useState(false); // Global loading for initial fetch
    const [error, setError] = useState(null);    // Global error for initial fetch
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentProducto, setCurrentProducto] = useState(null); // Product being viewed/edited
    const [searchQuery, setSearchQuery] = useState('');

    const navigate = useNavigate();

    /**
     * @function fetchProductos
     * @description Fetches the list of products from the API.
     * Controls whether a global loading screen is shown.
     * @param {boolean} showGlobalLoading - If true, activates the global loading state.
     */
    const fetchProductos = useCallback(async (showGlobalLoading = true) => {
        if (showGlobalLoading) {
            setLoading(true);
            setError(null);
        }
        try {
            // El `authenticatedFetch` podría ser la fuente del problema.
            // Si no devuelve un objeto 'Response' en caso de fallo,
            // el `try` no detectará el error HTTP.
            const response = await authenticatedFetch(`${API_BASE_URL}/productos`, {
                method: 'GET',
                credentials: 'include',
            });

            // Verifica si la respuesta es válida antes de intentar procesarla como JSON.
            // Esto es crucial para manejar errores de red o del servidor.
            if (!response) {
                throw new Error("La solicitud no devolvió una respuesta válida.");
            }

            if (response.status === 401) {
                setError('No autorizado: Su sesión ha expirado. Por favor, inicie sesión de nuevo.');
                if (showGlobalLoading) setLoading(false);
                navigate('/login');
                return;
            }

            if (!response.ok) {
                // Aquí, el código ya está preparado para manejar un error HTTP.
                const errorData = await response.json();
                throw new Error(errorData.mensaje || `Error HTTP! estado: ${response.status}`);
            }
            const data = await response.json();
            console.log("Productos.jsx: Raw data received from API (GET /productos):", data);

            // Ensure data is an array, handling data.data or just data
            const productsArray = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
            setProductos(productsArray);

        } catch (e) {
            console.error("Error fetching products:", e);
            // El error 'response.json is not a function' será capturado aquí,
            // y el mensaje de error será más claro para el usuario.
            setError('Error al cargar los productos: ' + e.message);
            setProductos([]);
        } finally {
            if (showGlobalLoading) {
                setLoading(false);
            }
        }
    }, [navigate]);

    useEffect(() => {
        fetchProductos();
    }, [fetchProductos]);

    /**
     * @function handleSearchChange
     * @description Handles the change in the search input, updating the state and resetting pagination.
     * @param {Object} event - Input event object.
     */
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
        setPagina(1); // Reset to the first page when search changes
    };

    // Logic to filter products based on searchQuery
    const filteredProducts = productos.filter(producto => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const productoEstadoText = Number(producto.estadoAI) === 1 ? 'activo' : 'inactivo';

        // Si la consulta de búsqueda está vacía, mostrar todos los productos.
        if (lowerCaseQuery.length === 0) {
            return true;
        }

        // Si la consulta es específicamente 'activo' o 'inactivo', filtrar solo por estado
        if (lowerCaseQuery === 'activo') {
            return productoEstadoText === 'activo';
        }
        if (lowerCaseQuery === 'inactivo') {
            return productoEstadoText === 'inactivo';
        }
        
        // Para cualquier otra consulta, buscar en todos los campos relevantes (incluyendo el estado textual)
        const matchesNombre = producto.nombre && producto.nombre.toLowerCase().includes(lowerCaseQuery);
        
        // Convertir precio a string para buscar
        const matchesPrecio = producto.precio !== undefined && producto.precio !== null &&
                              String(Number(producto.precio).toFixed(2)).includes(lowerCaseQuery);
        
        // Convertir cantidad a string para buscar
        const matchesCantidad = producto.cantidad !== undefined && producto.cantidad !== null &&
                                String(producto.cantidad).includes(lowerCaseQuery);
        
        const matchesMarca = producto.marca && producto.marca.toLowerCase().includes(lowerCaseQuery);
        
        // Búsqueda parcial por estado (si la query no era "activo" o "inactivo" exacto)
        const matchesPartialEstado = productoEstadoText.includes(lowerCaseQuery);

        // Retorna true si al menos una de las condiciones es verdadera
        return matchesNombre || matchesPrecio || matchesCantidad || matchesMarca || matchesPartialEstado;
    });

    // PAGINATION CALCULATION
    const pageCount = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const indexOfLastItem = pagina * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

    /**
     * @function handleToggleEstado
     * @description Toggles the status (Active/Inactive) of a product.
     * Shows a confirmation with SweetAlert2 and updates the UI without global reload.
     * @param {number} id - ID of the product to update.
     */
    const handleToggleEstado = async (id) => {
        const productoToUpdate = productos.find(producto => producto.ID_producto === id);
        if (productoToUpdate) {
            const result = await Swal.fire({
                title: '¿Está seguro de cambiar el estado de este producto?',
                text: 'Esta acción modificará el estado del producto.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#a1005b',
                cancelButtonColor: '#888',
                confirmButtonText: 'Sí, cambiar',
                cancelButtonText: 'Cancelar',
                customClass: { popup: 'swal2-zindex-fix' }
            });

            if (!result.isConfirmed) {
                return; // User cancelled
            }

            try {
                const newEstadoAI = Number(productoToUpdate.estadoAI) === 1 ? 0 : 1;

                // Prepare payload, ensuring numeric types are correct for API
                const payload = {
                    nombre: productoToUpdate.nombre,
                    precio: parseFloat(productoToUpdate.precio),
                    cantidad: Number(productoToUpdate.cantidad),
                    marca: productoToUpdate.marca,
                    IDCat_producto: Number(productoToUpdate.IDCat_producto),
                    descripcion: productoToUpdate.descripcion,
                    estadoAI: newEstadoAI
                };
                console.log("Productos.jsx: Payload for handleToggleEstado:", payload);

                const response = await authenticatedFetch(`${API_BASE_URL}/productos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });

                if (response.status === 401) {
                    setError('No autorizado: Su sesión ha expirado. Por favor, inicie sesión de nuevo.');
                    navigate('/login');
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.mensaje || 'Error al actualizar el estado');
                }
                const updatedProductData = await response.json();

                // Update the product in the local list immediately for smooth UI
                setProductos(prev =>
                    prev.map(prod =>
                        prod.ID_producto === id ? (updatedProductData.data || updatedProductData) : prod
                    )
                );
                Swal.fire({
                    icon: 'success',
                    title: '¡Estado cambiado!',
                    text: 'El estado del producto se cambió correctamente.',
                    confirmButtonColor: '#a1005b',
                    customClass: { popup: 'swal2-zindex-fix' }
                });

            } catch (e) {
                console.error("Error in handleToggleEstado:", e);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al cambiar el estado del producto: ' + e.message,
                    confirmButtonColor: '#a1005b',
                    customClass: { popup: 'swal2-zindex-fix' }
                });
            }
        }
    };

    // Modal open/close handlers
    const openCreateModal = () => setIsCreateModalOpen(true);
    
    const closeCreateModal = () => {
        // Desenfocar el elemento activo para evitar el warning de aria-hidden
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setIsCreateModalOpen(false);
    };

    const openEditModal = (producto) => {
        setCurrentProducto(producto);
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => {
        // Desenfocar el elemento activo para evitar el warning de aria-hidden
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setCurrentProducto(null);
        setIsEditModalOpen(false);
    };

    const openViewModal = (producto) => {
        setCurrentProducto(producto);
        setIsViewModalOpen(true);
    };
    const closeViewModal = () => {
        // Desenfocar el elemento activo para evitar el warning de aria-hidden
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setCurrentProducto(null);
        setIsViewModalOpen(false);
    };

// Funciones de gestión de productos revisadas con comentarios

/**
 * @function handleProductoCreated
 * @description Maneja la creación de un nuevo producto.
 * Ahora recibe un objeto FormData y lo envía directamente a la API.
 * @param {FormData} formData - Objeto FormData que contiene los datos y el archivo de imagen.
 */
const handleProductoCreated = async (formData) => {
    try {
        console.log("Productos.jsx: Enviando FormData a la API...");
        
        const url = `${API_BASE_URL}/productos`;
        const options = {
            method: 'POST',
            body: formData, // No se usa JSON.stringify() aquí
            // No es necesario especificar el header 'Content-Type', el navegador lo establece automáticamente para FormData.
        };

        const response = await authenticatedFetch(url, options);

        if (response.status === 401) {
            setError('No autorizado: Su sesión ha expirado. Por favor, inicie sesión de nuevo.');
            navigate('/login');
            return;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.mensaje || 'Error al crear el producto');
        }

        const responseData = await response.json();
        console.log("Productos.jsx: Respuesta del backend (crear):", responseData);
        
        await fetchProductos(false);
        setIsCreateModalOpen(false);

        Swal.fire({
            icon: 'success',
            title: '¡Producto creado!',
            text: 'El producto se creó correctamente.',
            confirmButtonColor: '#a1005b',
            customClass: { popup: 'swal2-zindex-fix' }
        });

    } catch (e) {
        console.error("Error en handleProductoCreated:", e);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al crear el producto: ' + e.message,
            confirmButtonColor: '#a1005b',
            customClass: { popup: 'swal2-zindex-fix' }
        });
    }
};

/**
 * @function handleProductoUpdated
 * @description Maneja la actualización de un producto existente.
 * Recibe un objeto FormData que incluye los datos y el ID del producto.
 * @param {FormData} formData - Objeto FormData con los datos actualizados y el ID del producto.
 */
const handleProductoUpdated = async (formData) => {
    try {
        const productoId = formData.get('ID_Producto');
        if (!productoId) {
            throw new Error('ID del producto no encontrado para la actualización.');
        }

        console.log(`Productos.jsx: Enviando FormData para actualizar el producto ID ${productoId}...`);
        
        const url = `${API_BASE_URL}/productos/${productoId}`;
        const options = {
            method: 'PUT',
            body: formData, // Enviar FormData directamente
        };

        const response = await authenticatedFetch(url, options);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.mensaje || 'Error al actualizar el producto');
        }

        const responseData = await response.json();
        console.log("Productos.jsx: Respuesta del backend (actualizar):", responseData);
        
        // Re-obtener los productos para reflejar los cambios
        await fetchProductos(false);
        setIsEditModalOpen(false);

        Swal.fire({
            icon: 'success',
            title: '¡Producto actualizado!',
            text: 'El producto se actualizó correctamente.',
            confirmButtonColor: '#a1005b',
            customClass: { popup: 'swal2-zindex-fix' }
        });

    } catch (e) {
        console.error("Error en handleProductoUpdated:", e);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al actualizar el producto: ' + e.message,
            confirmButtonColor: '#a1005b',
            customClass: { popup: 'swal2-zindex-fix' }
        });
    }
};


// Función auxiliar para calcular las páginas, lo que hace el código más limpio.
const calculatePageCount = (products, searchQuery) => {
    const filteredProducts = products.filter(p => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        if (!lowerCaseQuery) return true;

        const matchesNombre = p.nombre?.toLowerCase().includes(lowerCaseQuery);
        const matchesMarca = p.marca?.toLowerCase().includes(lowerCaseQuery);
        const matchesEstado = (p.estadoAI === 1 ? 'activo' : 'inactivo').includes(lowerCaseQuery);
        
        // Convertimos a string para buscar en `precio` y `cantidad`
        const matchesPrecio = String(p.precio)?.includes(lowerCaseQuery);
        const matchesCantidad = String(p.cantidad)?.includes(lowerCaseQuery);

        return matchesNombre || matchesMarca || matchesEstado || matchesPrecio || matchesCantidad;
    });

    return Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
};


/**
 * @function handleProductoDeleted
 * @description Maneja la eliminación de un producto usando SweetAlert2 para la confirmación.
 * @param {number} id - ID del producto a eliminar.
 */
const handleProductoDeleted = async (id) => {
    console.log("handleProductoDeleted: Función llamada con ID:", id);
    const result = await Swal.fire({
        title: '¿Está seguro de eliminar este producto?',
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
        console.log("Productos.jsx: Intentando eliminar el producto con ID:", id);
        const url = `${API_BASE_URL}/productos/${id}`;
        const response = await authenticatedFetch(url, { method: 'DELETE' });

        if (response.status === 401) {
            setError('No autorizado: Su sesión ha expirado. Por favor, inicie sesión de nuevo.');
            navigate('/login');
            return;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.mensaje || 'Error al eliminar producto');
        }

        // Actualizamos la lista de productos localmente para una respuesta más rápida.
        const updatedProducts = productos.filter(p => p.ID_producto !== id);
        setProductos(updatedProducts);

        // Usamos la función auxiliar para recalcular la paginación.
        const newPageCount = calculatePageCount(updatedProducts, searchQuery);

        // Ajustamos la página si es necesario.
        if (pagina > newPageCount && newPageCount > 0) {
            setPagina(newPageCount);
        } else if (newPageCount === 0 && updatedProducts.length === 0) {
            setPagina(1);
        }

        Swal.fire({
            icon: 'success',
            title: '¡Producto eliminado!',
            text: 'El producto fue eliminado correctamente.',
            confirmButtonColor: '#a1005b',
            customClass: { popup: 'swal2-zindex-fix' }
        });

    } catch (e) {
        console.error("Error en handleProductoDeleted:", e);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al eliminar el producto: ' + e.message,
            confirmButtonColor: '#a1005b',
            customClass: { popup: 'swal2-zindex-fix' }
        });
    }
};


    // Global loading/error screen
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh" flexDirection="column">
                <CircularProgress sx={{ color: '#a1005b' }} />
                <Typography variant="h6" sx={{ mt: 2, color: '#a1005b' }}>Cargando productos...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh" flexDirection="column">
                <Typography variant="h6" color="error">Error: {error}</Typography>
                <Button variant="contained" onClick={() => fetchProductos()} sx={{ mt: 2, bgcolor: '#a1005b', '&:hover': { bgcolor: '#ad1457' } }}>
                    Reintentar
                </Button>
            </Box>
        );
    }

    return (
         <div style={{ padding: "24px", maxWidth: "auto", margin: "0 20px 0 100px", minHeight: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <Typography variant="h4" gutterBottom sx={{ color: '#a1005b', fontWeight: "bold" }}>
                    Productos
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
                        "&:hover": { backgroundColor: "#ad1457" }
                    }}
                    onClick={openCreateModal}
                >
                    <AddIcon sx={{ mr: 0.5 }} /> Agregar Producto
                </Button>
            </div>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Nombre</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Precio</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Cantidad</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Marca</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentProducts.length > 0 ? (
                            currentProducts.map((producto) => (
                                <TableRow key={producto.ID_producto}>
                                    <TableCell>{producto.nombre}</TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat('es-CO', {
                                            style: 'currency',
                                            currency: 'COP',
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        }).format(producto.precio)}
                                    </TableCell>
                                    <TableCell>{producto.cantidad}</TableCell>
                                    <TableCell>{producto.marca}</TableCell>
                                    <TableCell>
                                        <Typography style={{ color: Number(producto.estadoAI) === 1 ? "green" : "red", fontWeight: 500 }}>
                                            {Number(producto.estadoAI) === 1 ? "Activo" : "Inactivo"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            <Switch
                                                checked={Number(producto.estadoAI) === 1}
                                                onChange={() => handleToggleEstado(producto.ID_producto)}
                                                color={Number(producto.estadoAI) === 1 ? "success" : "error"}
                                                inputProps={{ 'aria-label': `toggle status for ${producto.nombre}` }}
                                            />
                                            <IconButton onClick={() => openViewModal(producto)} aria-label="ver">
                                                <Eye />
                                            </IconButton>
                                            {/* Deshabilitar Editar y Eliminar si el producto está Inactivo (estadoAI === 0) */}
                                            <IconButton
                                                onClick={() => openEditModal(producto)}
                                                disabled={Number(producto.estadoAI) === 0}
                                                aria-label="editar"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleProductoDeleted(producto.ID_producto)}
                                                disabled={Number(producto.estadoAI) === 0}
                                                aria-label="eliminar"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography variant="subtitle1" color="text.secondary">
                                        No se encontraron productos.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Stack spacing={2} sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Pagination
                    count={pageCount}
                    page={pagina}
                    onChange={(event, value) => setPagina(value)}
                    color="primary"
                    sx={{
                        '& .MuiPaginationItem-root': {
                            color: '#a1005b',
                        },
                        '& .Mui-selected': {
                            backgroundColor: '#a1005b !important',
                            color: 'white !important',
                        },
                    }}
                />
            </Stack>

            {/* Modals */}
            <ProductoCreateModal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                onProductoCreated={handleProductoCreated}
                productos={productos}
            />

            <ProductoEditModal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                initialData={currentProducto}
                onProductoUpdated={handleProductoUpdated}
                productos={productos}
            />

            <ProductoViewModal
                isOpen={isViewModalOpen}
                onClose={closeViewModal}
                initialData={currentProducto}
            />
        </div>
    );
}
