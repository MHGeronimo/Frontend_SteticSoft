// src/models/Usuario.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      idUsuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_usuario' 
      },
      correo: {
        type: DataTypes.STRING(100), 
        allowNull: false,
        unique: true,
        field: 'correo',
        validate: {
          isEmail: true
        }
      },
      contrasena: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'contrasena'
      },
      idRol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_rol', 
        references: {
          model: 'rol',
          key: 'id_rol'
        },
        onDelete: 'RESTRICT' 
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      }
    },
    {
      tableName: 'usuario',
      timestamps: false
    }
  );

  Usuario.associate = (models) => {
    Usuario.belongsTo(models.Rol, {
      foreignKey: 'idRol',
      as: 'rol'
    });

    Usuario.hasOne(models.Cliente, {
      foreignKey: 'idUsuario',
      as: 'clienteInfo'
    });

    // ✅ AJUSTE FINAL: Se especifica la clave foránea de forma explícita en la asociación
    Usuario.hasOne(models.Empleado, {
      foreignKey: 'idUsuario', 
      as: 'empleadoInfo'
    });

    Usuario.hasMany(models.TokenRecuperacion, {
      foreignKey: 'idUsuario',
      as: 'tokensRecuperacion'
    });

    Usuario.belongsToMany(models.Novedad, {
      through: 'NovedadEmpleado',
      foreignKey: 'id_usuario',
      otherKey: 'id_novedad',
      as: 'novedades'
    });

    Usuario.hasMany(models.Abastecimiento, {
      foreignKey: 'idUsuario',
      as: 'abastecimientos'
    });

    Usuario.hasMany(models.HistorialCambiosRol, {
      foreignKey: "idUsuarioModifico",
      as: "modificacionesDeRol",
    });

    Usuario.hasMany(models.PermisosXRol, {
      foreignKey: "asignadoPor",
      as: "asignacionesDePermisos",
    });
  };

  return Usuario;
};