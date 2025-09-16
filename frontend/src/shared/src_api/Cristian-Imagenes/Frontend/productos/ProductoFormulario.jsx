// ProductoFormulario.jsx
import React, { useState, useEffect } from "react";
import {
    Button,
    Typography,
    TextField,
    Container,
    Grid,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Box,
    CircularProgress
} from "@mui/material";
import Swal from 'sweetalert2'; // Import SweetAlert2

// Define the API_BASE_URL here for consistency
const API_BASE_URL = 'http://localhost:3000/api';
const IMAGE_BASE_URL = 'http://localhost:3000';

/**
 * @function ProductoFormulario
 * @description Componente de formulario para productos (crear, editar, ver).
 * Muestra campos para nombre, precio, cantidad, marca, categoría, descripción e imagen.
 * Incluye validaciones frontend y manejo de carga de categorías.
 * @param {Object} props - Propiedades del componente.
 * @param {'create'|'edit'|'view'} props.mode - Modo del formulario:
 * - 'create': Para crear un nuevo producto.
 * - 'edit': Para editar un producto existente.
 * - 'view': Para mostrar los detalles de un producto (campos deshabilitados).
 * @param {Object} [props.initialData] - Datos iniciales para el formulario (requerido en modo 'edit' o 'view').
 * @param {function} props.onClose - Función para cerrar el formulario o el modal padre.
 * @param {function} props.onSave - Función para guardar o actualizar los datos del producto.
 * Esta función recibirá un objeto con los datos del producto validados.
 * @param {Array<Object>} [props.productos=[]] - Lista actual de productos para validación de nombres duplicados.
 * @param {boolean} [props.isDisabled=false] - Si es true, deshabilita todos los campos y botones del formulario.
 */
function ProductoFormulario({ mode, initialData, onClose, onSave, productos = [], isDisabled = false }) {
    const [nombre, setNombre] = useState("");
    const [precio, setPrecio] = useState("");
    const [cantidad, setCantidad] = useState("");
    const [marca, setMarca] = useState("");
    const [categoria, setCategoria] = useState(""); // Stores IDCat_producto
    const [descripcion, setDescripcion] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagen, setImagen] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(initialData?.Imagenes || null);

    // Estado para las categorías de productos
    const [categorias, setCategorias] = useState([]);
    // Estado para los errores de validación por campo
    const [errors, setErrors] = useState({});

    // Cargar categorías de productos desde la API
    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/cat_productos`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.status === 401) {
                    console.warn('ProductoFormulario: Not authorized to load categories. Please log in.');
                    return;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Error in HTTP response (GET cat_productos):", response.status, errorText);
                    return;
                }
                const data = await response.json();
                console.log("ProductoFormulario.jsx: Raw data received from API (GET /cat_productos):", data);

                const categoriesArray = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                setCategorias(categoriesArray);
            } catch (e) {
                console.error("Error fetching product categories:", e);
                setCategorias([]);
            }
        };
        fetchCategorias();
    }, []);

    // Load initial data and reset errors when mode or initialData changes
    useEffect(() => {
        setErrors({}); // Always clear errors when modal opens or mode changes

        if (mode === 'create') {
            setNombre("");
            setPrecio("");
            setCantidad("");
            setMarca("");
            setCategoria(""); // Always reset for create mode
            setDescripcion("");
            setImagen(null);
        } else if ((mode === 'edit' || mode === 'view') && initialData) {
            console.log('ProductoFormulario: initialData received:', initialData);

            setNombre(initialData.nombre || "");
            setMarca(initialData.marca || "");
            setPrecio(initialData.precio !== null && initialData.precio !== undefined ? String(initialData.precio) : "");
            setCantidad(initialData.cantidad !== null && initialData.cantidad !== undefined ? String(initialData.cantidad) : "");
            setDescripcion(initialData.descripcion || "");

            // SOLO establecer la categoría si las categorías ya están cargadas
            // Esto evita que el Select intente renderizar un valor que aún no existe en sus opciones
            setCategoria(initialData.IDCat_producto !== null && initialData.IDCat_producto !== undefined ? String(initialData.IDCat_producto) : "");

            if ((mode === 'edit' || mode === 'view') && initialData) {
                // ... (resto de la inicialización de los campos)
                if (initialData.Imagenes) {
                    // Si existe una imagen, construir la URL completa y establecerla
                    setPreviewUrl(`${IMAGE_BASE_URL}${initialData.Imagenes}`);
                } else {
                    setPreviewUrl(null);
                }
            }
        }
    }, [initialData, mode, categorias]); // Mantener 'categorias' en las dependencias es crucial

/**
 * @function handleImagenChange
 * @description Maneja la selección de un archivo de imagen.
 * @param {object} e El evento de cambio del input de archivo.
 */
const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    } else {
        setImageFile(null);
        setPreviewUrl(null);
    }
};


    /**
     * @function validateForm
     * @description Performs frontend validation for all form fields.
     * @returns {boolean} True if all fields are valid, false otherwise.
     */
    const validateForm = () => {
        let tempErrors = {};
        let isValid = true;

        // Validate Nombre del Producto
        if (!nombre || nombre.trim() === "") {
            tempErrors.nombre = "El nombre del producto es obligatorio.";
            isValid = false;
        } else if (nombre.startsWith(' ')) { // Nueva validación: no espacios al inicio
            tempErrors.nombre = "El nombre no puede iniciar con espacios.";
            isValid = false;
        } else if (nombre.length > 30) {
            tempErrors.nombre = "El nombre no debe superar los 30 caracteres.";
            isValid = false;
        } else {
            // Validate unique name (case-insensitive, excluding current product in edit mode)
            const isNameTaken = productos.some(p =>
                p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() &&
                (mode === 'edit' ? p.ID_Producto !== initialData.ID_Producto : true)
            );
            if (isNameTaken) {
                tempErrors.nombre = "Ya existe un producto con este nombre.";
                isValid = false;
            }
        }

        // Validate Precio
        const parsedPrecio = parseFloat(precio);
        if (!precio || precio.trim() === "") {
            tempErrors.precio = "El precio es obligatorio.";
            isValid = false;
        } else if (isNaN(parsedPrecio) || parsedPrecio <= 0) {
            tempErrors.precio = "El precio debe ser un número válido y no negativo.";
            isValid = false;
        }

        // Validate Cantidad
        const parsedCantidad = parseInt(cantidad, 10);
        if (!cantidad || cantidad.trim() === "") {
            tempErrors.cantidad = "La cantidad es obligatoria.";
            isValid = false;
        } else if (isNaN(parsedCantidad) || parsedCantidad < 0) {
            tempErrors.cantidad = "La cantidad debe ser un número entero y no negativo.";
            isValid = false;
        }

        // Validate Marca
        if (!marca || marca.trim() === "") {
            tempErrors.marca = "La marca es obligatoria.";
            isValid = false;
        }

        // Validate Categoría
        if (!categoria) {
            tempErrors.categoria = "La categoría es obligatoria.";
            isValid = false;
        }

        // Validate Descripción (maximum 100 characters)
        if (descripcion.length > 100) {
            tempErrors.descripcion = "La descripción no debe superar los 100 caracteres.";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    /**
 * @function handleGuardar
 * @description Maneja el intento de guardar o actualizar un producto.
 * Realiza las validaciones de frontend y llama a la función onSave.
 */
const handleGuardar = (event) => {
    event.preventDefault(); 
    if (validateForm()) {
        const formData = new FormData();
        
        // Agregamos todos los campos del formulario
        formData.append('nombre', nombre);
        formData.append('precio', precio);
        formData.append('cantidad', cantidad);
        formData.append('marca', marca);
        formData.append('IDCat_producto', categoria);
        formData.append('descripcion', descripcion);
        
        // Determina el estado del producto basado en el modo.
        // Si es un producto nuevo ('create'), el estado por defecto es 1 (activo).
        // Si es un producto existente ('edit'), usa el valor de los datos iniciales.
        const estadoAIValue = mode === 'create' ? 1 : (initialData?.estadoAI !== undefined ? initialData.estadoAI : 1);
        formData.append('estadoAI', Number(estadoAIValue));
        
        // Lógica para la imagen
        // Aquí verificamos si se ha seleccionado una nueva imagen (imageFile)
        if (imageFile) {
            // El campo de la imagen se llama 'Imagenes' en el backend
            formData.append('Imagenes', imageFile);
        } else if (mode === 'edit' && initialData && initialData.Imagenes) {
            // Si estamos en modo de edición y no se ha subido una nueva imagen,
            // enviamos la URL de la imagen existente para que el backend la mantenga.
            formData.append('Imagenes', initialData.Imagenes);
        }

        // Aseguramos que el ID_producto se adjunte SÓLO si estamos editando
        if (mode === 'edit' && initialData && initialData.ID_producto) {
            formData.append('ID_Producto', initialData.ID_producto);
        } else if (mode === 'edit') {
            console.error("Error: Modo de edición activado pero no se pudo encontrar el ID_Producto en los datos iniciales.");
        }
        
        // Log para depurar
        console.log("ProductoFormulario: Data to be sent:", Object.fromEntries(formData.entries()));
        onSave(formData);
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error de Validación',
            text: 'Por favor, revise los campos marcados en rojo.',
            confirmButtonColor: '#a1005b',
            customClass: { popup: 'swal2-zindex-fix' }
        });
    }
};
const formIsDisabled = isDisabled || mode === 'view';
const isCreateMode = mode === 'create';

    return (
        <Container maxWidth="sm">
            <Grid container spacing={2} mt={0}>
                <Grid item xs={12} sm={12}>
                    <TextField
                        required
                        fullWidth
                        label="Nombre del Producto"
                        variant="outlined"
                        value={nombre}
                        onChange={(e) => {
                            setNombre(e.target.value);
                            setErrors(prev => ({ ...prev, nombre: undefined })); // Clear error on change
                        }}
                        sx={{ backgroundColor: 'white', borderRadius: '6px' }}
                        disabled={formIsDisabled}
                        inputProps={{ maxLength: 30 }}
                        error={!!errors.nombre}
                        helperText={errors.nombre}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                {/* Agregamos una condición aquí */}
                {categorias.length > 0 ? (
                    <FormControl required fullWidth variant="outlined" sx={{ backgroundColor: 'white', borderRadius: '6px' }} disabled={formIsDisabled} error={!!errors.categoria}>
                        <InputLabel>Categoría</InputLabel>
                        <Select
                            value={categoria}
                            onChange={(e) => {
                                setCategoria(e.target.value);
                                setErrors(prev => ({ ...prev, categoria: undefined }));
                            }}
                            label="Categoría"
                        >
                            {categorias.map(cat => (
                                <MenuItem key={String(cat.IDCat_producto)} value={String(cat.IDCat_producto)}>
                                    {cat.Nombre}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.categoria && (
                            <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                                {errors.categoria}
                            </Typography>
                        )}
                    </FormControl>
                    ) : (
                        // Muestra un indicador de carga mientras las categorías se obtienen.
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                            <CircularProgress />
                        </Box>
                    )}
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        label="Precio"
                        variant="outlined"
                        type="number"
                        inputProps={{ step: "0.01", min: "0" }}
                        value={precio}
                        onChange={(e) => {
                            setPrecio(e.target.value);
                            setErrors(prev => ({ ...prev, precio: undefined })); // Clear error on change
                        }}
                        sx={{ backgroundColor: 'white', borderRadius: '6px' }}
                        disabled={formIsDisabled}
                        error={!!errors.precio}
                        helperText={errors.precio}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        label="Cantidad"
                        variant="outlined"
                        type="number"
                        inputProps={{ min: "0" }}
                        value={cantidad}
                        onChange={(e) => {
                            setCantidad(e.target.value);
                            setErrors(prev => ({ ...prev, cantidad: undefined })); // Clear error on change
                        }}
                        sx={{ backgroundColor: 'white', borderRadius: '6px' }}
                        disabled={formIsDisabled}
                        error={!!errors.cantidad}
                        helperText={errors.cantidad}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        label="Marca"
                        variant="outlined"
                        value={marca}
                        onChange={(e) => {
                            setMarca(e.target.value);
                            setErrors(prev => ({ ...prev, marca: undefined })); // Clear error on change
                        }}
                        sx={{ backgroundColor: 'white', borderRadius: '6px' }}
                        disabled={formIsDisabled}
                        error={!!errors.marca}
                        helperText={errors.marca}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Descripción"
                        variant="outlined"
                        multiline
                        rows={4}
                        value={descripcion}
                        onChange={(e) => {
                            setDescripcion(e.target.value);
                            setErrors(prev => ({ ...prev, descripcion: undefined })); // Clear error on change
                        }}
                        sx={{ backgroundColor: 'white', borderRadius: '6px' }}
                        disabled={formIsDisabled}
                        inputProps={{ maxLength: 100 }} // <-- AÑADIDO/MODIFICADO AQUÍ
                        error={!!errors.descripcion} // <-- AÑADIDO AQUÍ
                        helperText={errors.descripcion} // <-- AÑADIDO AQUÍ
                    />
                </Grid>
                <Grid item xs={12}>
                    {/* ... Tu botón de seleccionar imagen ... */}
                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{
                            borderColor: '#8b005d',
                            textTransform: 'none',
                            backgroundColor: '#ad1457', color: 'white',
                            "&:hover": { backgroundColor: "#ad1457" }
                        }}
                        // Agrega la deshabilitación para los modos edit y view
                        disabled={mode === 'view'}
                    >
                        Seleccionar Imagen
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImagenChange}
                        />
                    </Button>
                    {previewUrl && (
                        <div style={{ marginTop: "16px", textAlign: "center" }}>
                            <img
                                // Usa previewUrl para mostrar la imagen
                                src={previewUrl}
                                alt="Vista previa de la imagen del producto"
                                style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px" }}
                            />
                        </div>
                    )}
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="space-between">
                    <Button onClick={onClose} sx={{
                        backgroundColor: "#ad1457", textTransform: "none", color: "white",
                        ":hover": { backgroundColor: "#ad1457" }, fontWeight: 'bold'
                    }}
                    disabled={formIsDisabled && mode !== 'view'}
                    >
                        {mode === 'view' ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {mode !== 'view' && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleGuardar}
                            type="button"
                            sx={{
                                fontWeight: 'bold', textTransform: "none", backgroundColor: "#a1005b",
                                "&:hover": { backgroundColor: "#a1005b" }
                            }}
                            disabled={formIsDisabled}
                        >
                            {isCreateMode ? 'Guardar' : 'Actualizar'}
                        </Button>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
}

export default ProductoFormulario;
