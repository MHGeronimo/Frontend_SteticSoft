// src/models/Cita.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Cita = sequelize.define(
    'Cita',
    {
      idCita: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_cita'
      },

      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },

      horaInicio: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'hora_inicio'
      },

      precioTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'precio_total'
      },

      idEstado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_estado',
        defaultValue: 5,
        references: {
          model: 'estado',
          key: 'id_estado'
        }
      },
      idCliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_cliente',
        references: {
          model: 'cliente',
          key: 'id_cliente'
        }
      },

      idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: true, 
        field: 'id_usuario',
        references: {
          model: 'usuario',
          key: 'id_usuario'
        }
      },
      
      idNovedad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_novedad',
        references: {
          model: 'novedades',
          key: 'id_novedad'
        }
      }
    },
    {
      tableName: 'cita',
      timestamps: false
    }
  );

  Cita.associate = (models) => {
    Cita.belongsTo(models.Estado, {
      foreignKey: 'idEstado',
      as: 'estadoDetalle'
    });
    Cita.belongsTo(models.Cliente, {
      foreignKey: 'idCliente',
      as: 'cliente'
    });

    Cita.belongsTo(models.Usuario, {
      foreignKey: 'idUsuario',
      as: 'empleado'
    });

    Cita.belongsTo(models.Novedad, {
      foreignKey: 'idNovedad',
      as: 'novedad'
    });

    Cita.belongsToMany(models.Servicio, {
      through: 'servicio_x_cita',
      foreignKey: 'id_cita',
      otherKey: 'id_servicio',
      as: 'servicios'
    });
    
    Cita.hasMany(models.VentaXServicio, {
      foreignKey: 'idCita',
      as: 'detallesVenta'
    });
  };

  return Cita;
};