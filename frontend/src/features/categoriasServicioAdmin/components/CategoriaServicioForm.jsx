import React, { useState, useEffect } from 'react';

const INITIAL_FORM_STATE = {
  nombre: '',
  descripcion: '',
  estado: true
};

const CategoriaForm = ({ isOpen, onClose, onSubmit, initialData, isEditMode, categoriasExistentes = [] }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setFormData({
          nombre: initialData.nombre || '',
          descripcion: initialData.descripcion || '',
          estado: initialData.estado,
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
      setErrors({});
      setApiError('');
    }
  }, [isOpen, isEditMode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value, true);
  };

  const validateField = (name, value, checkLength = false) => {
  let error = '';
  const trimmedValue = value.trim();
  const validationRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+(\s[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$/;

  // Validación de formato
  if ((name === 'nombre' || name === 'descripcion') && value && !validationRegex.test(value)) {
    error = /^\s|\s$/.test(value)
      ? 'No se permiten espacios al inicio o al final.'
      : 'Solo se permiten letras, números y espacios intermedios.';
  }

  // Validaciones específicas para nombre
  if (name === 'nombre' && !error) {
    if (!trimmedValue) {
      error = 'El nombre es obligatorio.';
    } else if (trimmedValue.length < 3) {
      error = 'El nombre debe tener al menos 3 caracteres.';
    } else if (trimmedValue.length > 45) {
      error = 'El nombre no puede exceder los 45 caracteres.';
    } else {
      const nombreIngresado = trimmedValue.toLowerCase().replace(/\s+/g, ' ');
      const nombreOriginal = initialData?.nombre?.trim().toLowerCase().replace(/\s+/g, ' ') || null;

      const categoriaDuplicada = categoriasExistentes.find(cat =>
        cat.nombre.trim().toLowerCase().replace(/\s+/g, ' ') === nombreIngresado
      );

      if (categoriaDuplicada && (!isEditMode || nombreIngresado !== nombreOriginal)) {
        error = `Ya existe una categoría con el nombre "${categoriaDuplicada.nombre}".`;
      }
    }
  }

  // Validaciones específicas para descripción
  if (name === 'descripcion' && !error) {
    if (!trimmedValue) {
      error = 'La descripción es obligatoria.';
    } else if (trimmedValue.length > 200) {
      error = 'La descripción no puede exceder los 200 caracteres.';
    }
  }

  setErrors(prev => ({ ...prev, [name]: error }));
  return !error;
};



  const validateForm = () => {
    const isNombreValid = validateField('nombre', formData.nombre, true);
    const isDescripcionValid = validateField('descripcion', formData.descripcion, true);
    return isNombreValid && isDescripcionValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const datosAEnviar = {
        ...formData,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
      };

      await onSubmit(datosAEnviar);
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Ocurrió un error al guardar.';
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  const isFormInvalid = Object.values(errors).some(error => !!error) || !formData.nombre.trim() || !formData.descripcion.trim();

  return (
    <div className="modal-Categoria">
      <div className="modal-content-Categoria formulario">
        <button type="button" className="modal-close-button" onClick={onClose} title="Cerrar">&times;</button>
        <h3>{isEditMode ? 'Editar Categoría de Servicio' : 'Nueva Categoría'}</h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="camposAgregarCategoria">
            <label htmlFor="nombre">Nombre <span className="requiredCategoria">*</span></label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              className={`campoAgregarCategoria ${errors.nombre ? 'input-error' : ''}`}
              value={formData.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
              required
              autoComplete="off"
              placeholder="Ej: Limpieza de Hogar"
            />
            {errors.nombre && <div className="error">{errors.nombre}</div>}
          </div>

          <div className="camposAgregarCategoria">
            <label htmlFor="descripcion">Descripción <span className="requiredCategoria">*</span></label>
            <textarea
              id="descripcion"
              name="descripcion"
              className={`campoAgregarCategoria ${errors.descripcion ? 'input-error' : ''}`}
              value={formData.descripcion}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="4"
              disabled={loading}
              required
            ></textarea>
            {errors.descripcion && <div className="error">{errors.descripcion}</div>}
          </div>

          {apiError && <p className="error" style={{ textAlign: 'center', width: '100%' }}>{apiError}</p>}

          <div className="containerBotonesAgregarCategoria">
            <button type="submit" className="botonEditarCategoria" disabled={loading || isFormInvalid}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" className="botonEliminarCategoria" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriaForm;
