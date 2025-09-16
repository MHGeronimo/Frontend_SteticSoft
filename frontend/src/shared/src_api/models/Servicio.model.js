// src/models/Servicio.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Servicio = sequelize.define(
    'Servicio',
    {
      idServicio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_servicio'
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'nombre'
      },
      descripcion: {
        type: DataTypes.TEXT,
        field: 'descripcion'
      },
      precio: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        field: 'precio'
      },
      imagen: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'imagen'
      },
      imagenPublicId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'imagen_public_id'
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      },
      idCategoriaServicio: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_categoria_servicio',
        references: {
          model: 'categoria_servicio',
          key: 'id_categoria_servicio'
        },
        onDelete: 'RESTRICT'
      }
    },
    {
      tableName: 'servicio',
      timestamps: false
    }
  );

    Servicio.associate = (models) => {
      // CORRECCIÓN: Usar el nombre de la columna de la BD
      Servicio.belongsTo(models.CategoriaServicio, {
      foreignKey: 'id_categoria_servicio',  // ← NOMBRE DE LA COLUMNA EN BD
      as: 'categoria'
    });

    // Un Servicio puede estar incluido en muchas Citas.
    Servicio.belongsToMany(models.Cita, {
      through: 'servicio_x_cita',
      foreignKey: 'id_servicio',     // ← Mantener consistencia
      otherKey: 'id_cita',           
      as: 'citas'
    });

    // Un Servicio puede ser parte de muchas Ventas.
    Servicio.belongsToMany(models.Venta, {
      through: models.VentaXServicio,
      foreignKey: 'id_servicio',     // ← Mantener consistencia  
      otherKey: 'id_venta',          
      as: 'ventas'
    });
  };

  return Servicio;
};
