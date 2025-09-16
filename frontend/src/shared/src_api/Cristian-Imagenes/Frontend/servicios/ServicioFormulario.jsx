// ServicioFormulario.jsx
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
    Box
} from "@mui/material";
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import Swal from 'sweetalert2';

// Función para parsear el string de duración de la DB a un objeto Date para el TimePicker
const parseDbDurationToDate = (durationString) => {
    if (!durationString) return null;

    const parts = durationString.split(':');
    if (parts.length < 2) return null; // Debe tener al menos horas y minutos

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0; // Si incluye segundos

    const date = new Date();
    date.setHours(hours, minutes, seconds, 0); // Asigna horas, minutos, segundos
    return date;
};

/**
 * @function ServicioFormulario
 * @description Componente de formulario para servicios (crear, editar, ver).
 * @param {Object} props - Propiedades del componente.
 * @param {'create'|'edit'|'view'} props.mode - Modo del formulario.
 * @param {Object} props.initialData - Datos iniciales para el formulario (en modo 'edit' o 'view').
 * @param {function} props.onClose - Función para cerrar el formulario/modal.
 * @param {function} props.onSave - Función para guardar los datos del servicio.
 * @param {Array<Object>} props.servicios - Lista actual de servicios para validación de nombres duplicados.
 * @param {Array<Object>} props.categorias - Lista de categorías de servicios disponibles.
 */
function ServicioFormulario({ mode, initialData, onClose, onSave, servicios = [], categorias = [] }) {
    const [nombre, setNombre] = useState("");
    const [tiempoDate, setTiempoDate] = useState(null);
    const [precio, setPrecio] = useState("");
    const [categoria, setCategoria] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [imageFile, setImageFile] = useState(null);
    // ✅ 1. Cambiar la inicialización del estado de la vista previa
    const [imagePreview, setImagePreview] = useState('');

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (mode === 'create') {
            setNombre("");
            setTiempoDate(null);
            setPrecio("");
            setCategoria("");
            setDescripcion("");
            // ✅ 2. Resetear los estados de imagen para el modo 'create'
            setImageFile(null);
            setImagePreview('');
            setErrors({});
        } else if ((mode === 'edit' || mode === 'view') && initialData) {
            setNombre(initialData.nombre || "");
            setTiempoDate(parseDbDurationToDate(initialData.duracion));
            setPrecio(initialData.precio !== null && initialData.precio !== undefined ? String(initialData.precio) : "");
            setDescripcion(initialData.descripcion || "");
            setErrors({}); 

            if (categorias.length > 0) {
                const initialCatId = String(initialData.CodigoCat);
                const categoryExists = categorias.some(cat => String(cat.CodigoCat) === initialCatId);
                setCategoria(categoryExists ? initialCatId : "");
            } else {
                setCategoria(initialData.CodigoCat ? String(initialData.CodigoCat) : "");
            }
            
            // ✅ 3. Lógica para mostrar la imagen en los modos 'edit' y 'view'
            setImageFile(null);
            if (initialData.Imagenes) {
                // Se construye la URL completa para mostrar la imagen guardada
                setImagePreview(`http://localhost:3000/${initialData.Imagenes}`);
            } else {
                setImagePreview('');
            }
        }
    }, [mode, initialData, categorias]); // ✅ Agregar initialData como dependencia

    const handleImagenChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            // ✅ 4. Revertir a la imagen original si el usuario cancela la selección
            setImagePreview(initialData?.Imagenes ? `http://localhost:3000/${initialData.Imagenes}` : '');
        }
    };

    // ✅ NUEVA FUNCIÓN AÑADIDA
    const validateField = (name, value) => {
        let error = "";
        switch (name) {
            case 'nombre':
                if (!value || value.trim() === "") {
                    error = "El nombre del servicio es obligatorio.";
                } else if (value.startsWith(' ')) {
                    error = "El nombre no puede iniciar con espacios.";
                } else {
                    const isNameTaken = servicios.some(s =>
                        s.nombre.trim().toLowerCase() === value.trim().toLowerCase() &&
                        (mode === 'edit' ? s.ID_Servicio !== initialData.ID_Servicio : true)
                    );
                    if (isNameTaken) {
                        error = "Ya existe un servicio con este nombre.";
                    }
                }
                break;
            case 'precio':
                const parsedPrecio = parseFloat(value);
                if (!value || value.trim() === "") {
                    error = "El precio es obligatorio.";
                } else if (isNaN(parsedPrecio) || parsedPrecio <= 0) {
                    error = "El precio debe ser un número positivo.";
                }
                break;
            case 'categoria':
                if (!value) {
                    error = "La categoría es obligatoria.";
                }
                break;
            case 'tiempo':
                if (!value || isNaN(value.getTime())) {
                    error = "La duración es obligatoria y debe ser una hora válida (HH:mm).";
                }
                break;
            case 'descripcion':
                if (value.length > 100) {
                    error = "La descripción no debe superar los 100 caracteres.";
                }
                break;
            default:
                break;
        }
        setErrors(prevErrors => ({ ...prevErrors, [name]: error || undefined }));
    };

    /**
     * @function validateForm
     * @description Valida todos los campos del formulario y actualiza el estado de errores.
     * @returns {boolean} True si el formulario es válido, false en caso contrario.
     */
    const validateForm = () => { // <-- AQUÍ ESTÁ LA FUNCIÓN validateForm
        let tempErrors = {};
        let isValid = true;

        // Validar Nombre del Servicio
        if (!nombre || nombre.trim() === "") {
            tempErrors.nombre = "El nombre del servicio es obligatorio.";
            isValid = false;
        } else if (nombre.startsWith(' ')) { // Nueva validación: no espacios al inicio
            tempErrors.nombre = "El nombre no puede iniciar con espacios.";
            isValid = false;
        } else {
            // Validación de nombre repetido (excluyendo el propio servicio en modo edición)
            const isNameTaken = servicios.some(s =>
                s.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() &&
                (mode === 'edit' ? s.ID_Servicio !== initialData.ID_Servicio : true)
            );
            if (isNameTaken) {
                tempErrors.nombre = "Ya existe un servicio con este nombre.";
                isValid = false;
            }
        }

        // Validar Duración (TimePicker)
        if (!tiempoDate || isNaN(tiempoDate.getTime())) { // getTime() para verificar validez del objeto Date
            tempErrors.tiempo = "La duración es obligatoria y debe ser una hora válida (HH:mm).";
            isValid = false;
        }

        // Validar Precio
        const parsedPrecio = parseFloat(precio);
        if (!precio || precio.trim() === "") {
            tempErrors.precio = "El precio es obligatorio.";
            isValid = false;
        } else if (isNaN(parsedPrecio) || parsedPrecio <= 0) {
            tempErrors.precio = "El precio debe ser un número positivo.";
            isValid = false;
        }

        // Validar Categoría
        if (!categoria) {
            tempErrors.categoria = "La categoría es obligatoria.";
            isValid = false;
        }

        // Validar Descripción (máximo 100 caracteres) // <-- INICIO DE LA NUEVA VALIDACIÓN
        if (descripcion.length > 100) {
            tempErrors.descripcion = "La descripción no debe superar los 100 caracteres.";
            isValid = false;
        } // <-- FIN DE LA NUEVA VALIDACIÓN

        setErrors(tempErrors);
        return isValid;
    };

    const handleGuardar = () => {
        if (validateForm()) {
            let tiempoFormateado = tiempoDate ? format(tiempoDate, 'HH:mm:ss') : '';

            // 🔴 Paso crucial: Crea un nuevo objeto FormData
            const formData = new FormData();
            
            // Agrega todos los campos de texto
            formData.append('nombre', nombre);
            formData.append('duracion', tiempoFormateado); // 'duracion' es como lo llamas en el backend
            formData.append('precio', parseFloat(precio));
            formData.append('descripcion', descripcion);
            formData.append('CodigoCat', Number(categoria));

            // 🔴 Agrega el archivo de imagen solo si se ha seleccionado uno
            if (imageFile) {
                formData.append('Imagenes', imageFile); // 'imagen' debe coincidir con el nombre de campo esperado por tu backend
            }

            if (mode === "edit") {
                // Añade el ID y el estado actual del servicio
                formData.append('ID_Servicio', initialData.ID_Servicio);
                formData.append('estadoAI', Number(initialData.estadoAI));
            } else {
                // En modo 'create', añade el estado por defecto
                formData.append('estadoAI', 1);
            }
            const formDataObject = Object.fromEntries(formData.entries());
                    console.log("Contenido de FormData antes de enviar:", formDataObject);
                        // Llama a la función onSave con el objeto FormData
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

    const isDisabled = mode === 'view';
    const isCreateMode = mode === 'create';

return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container maxWidth="sm">
            <Grid container spacing={2} mt={0}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        label="Nombre del Servicio"
                        variant="outlined"
                        value={nombre}
                        onChange={(e) => {
                            setNombre(e.target.value);
                            validateField('nombre', e.target.value);
                        }}
                        sx={{ backgroundColor: 'white', borderRadius: '6px' }}
                        disabled={isDisabled}
                        error={!!errors.nombre}
                        helperText={errors.nombre}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required disabled={isDisabled} error={!!errors.categoria}>
                        <InputLabel id="categoria-label">Categoría</InputLabel>
                        <Select
                            labelId="categoria-label"
                            id="categoria"
                            value={categoria}
                            label="Categoría"
                            onChange={(e) => {
                                setCategoria(e.target.value); // ✅ Corregido aquí
                                validateField('categoria', e.target.value); // ✅ Corregido aquí
                            }}
                            sx={{ backgroundColor: 'white', borderRadius: '6px' }}
                        >
                            {categorias.length > 0 ? (
                                categorias.map(cat => (
                                    <MenuItem key={String(cat.CodigoCat)} value={String(cat.CodigoCat)}>
                                        {cat.nombre}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value="" disabled>
                                    No hay categorías disponibles
                                </MenuItem>
                            )}
                        </Select>
                        {errors.categoria && (
                            <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                                {errors.categoria}
                            </Typography>
                        )}
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TimePicker
                        label="Duración (HH:mm:ss)"
                        value={tiempoDate}
                        onChange={(newValue) => {
                            setTiempoDate(newValue); // ✅ Corregido aquí
                            validateField('tiempo', newValue);
                        }}
                        ampm={false}
                        views={['hours', 'minutes', 'seconds']}
                        format="HH:mm:ss"
                        disabled={isDisabled}
                        slotProps={{
                            textField: {
                                required: true,
                                fullWidth: true,
                                variant: "outlined",
                                sx: { backgroundColor: 'white', borderRadius: '6px' },
                                disabled: isDisabled,
                                error: !!errors.tiempo,
                                helperText: errors.tiempo,
                            }
                        }}
                    />
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
                            setPrecio(e.target.value); // ✅ Corregido aquí
                            validateField('precio', e.target.value);
                        }}
                        sx={{ backgroundColor: 'white', borderRadius: '6px' }}
                        disabled={isDisabled}
                        error={!!errors.precio}
                        helperText={errors.precio}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Descripción"
                        variant="outlined"
                        multiline
                        rows={5}
                        value={descripcion}
                        onChange={(e) => {
                            setDescripcion(e.target.value); // ✅ Corregido aquí
                            validateField('descripcion', e.target.value);
                        }}
                        sx={{ backgroundColor: 'white', borderRadius: '6px' }}
                        disabled={isDisabled}
                        inputProps={{ maxLength: 100 }}
                        error={!!errors.descripcion}
                        helperText={errors.descripcion}
                    />
                </Grid>

                <Grid item xs={12}>
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
                        disabled={isDisabled}
                    >
                        Seleccionar Imagen
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImagenChange}
                        />
                    </Button>
                    {imagePreview && (
                        <Box mt={2} sx={{ textAlign: 'center' }}>
                            <img
                                src={imagePreview}
                                alt="Vista previa del servicio"
                                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                            />
                        </Box>
                    )}
                </Grid>

                <Grid item xs={12} display="flex" justifyContent="space-between">
                    <Button onClick={onClose} sx={{
                        backgroundColor: "#ad1457", textTransform: "none", color: "white",
                        ":hover": { backgroundColor: "#ad1457" }, fontWeight: 'bold'
                    }}>
                        {isDisabled ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!isDisabled && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleGuardar}
                            sx={{
                                fontWeight: 'bold', textTransform: "none", backgroundColor: "#a1005b",
                                "&:hover": { backgroundColor: "#a1005b" }
                            }}
                        >
                            {isCreateMode ? 'Guardar' : 'Actualizar'}
                        </Button>
                    )}
                </Grid>
            </Grid>
        </Container>
    </LocalizationProvider>
);
}

export default ServicioFormulario;
