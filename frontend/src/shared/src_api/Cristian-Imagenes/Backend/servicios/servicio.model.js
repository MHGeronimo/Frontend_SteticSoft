    // src/models/servicio.model.js
    import { DataTypes } from "sequelize";
    import sequelize from "../db.js"; // Asegúrate de que esta ruta sea correcta
    import Cat_Servicio from "./catservicio.model.js"; // Importa el modelo de Cat_Servicio

    const Servicio = sequelize.define("Servicio", {
      ID_Servicio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(100), // Nombre del servicio, ej. "Corte de Cabello Básico"
        allowNull: false,
        unique: true, // Asegura que no haya dos servicios con el mismo nombre
      },
      duracion: {
        type: DataTypes.INTEGER, // Duración en minutos, ej. 30, 60
        allowNull: false,
        validate: {
          min: 1, // Duración mínima de 1 minuto
        }
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2), // Precio con 2 decimales, ej. 25.50
        allowNull: false,
        validate: {
          min: 0, // El precio no puede ser negativo
        }
      },
      estadoAI: {
        type: DataTypes.INTEGER,
        defaultValue: 1, // 1 para activo, 0 para inactivo
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.TEXT, // Para una descripción detallada, puedes usar STRING(X) si prefieres un límite
        allowNull: true,     // La descripción puede ser opcional
      },
      CodigoCat: { // Esta es la clave foránea que relaciona con Cat_Servicio
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Cat_Servicio, // Referencia al modelo Cat_Servicio
          key: 'CodigoCatS',   // Columna en Cat_Servicio a la que se hace referencia
        },
        onUpdate: 'CASCADE', // Actualiza automáticamente si CodigoCatS cambia en Cat_Servicio
        onDelete: 'RESTRICT', // Evita borrar una categoría si tiene servicios asociados
      },
      Imagenes: {
          type: DataTypes.STRING,
          allowNull: true,
      }
    }, {
      tableName: "servicio", // Nombre de la tabla en la base de datos
      timestamps: false,     // No se crean las columnas createdAt y updatedAt
    });

    // Definir la relación (asociación)
    // Un Servicio pertenece a una Cat_Servicio
    Servicio.belongsTo(Cat_Servicio, {
      foreignKey: 'CodigoCat',
      targetKey: 'CodigoCatS', // Clave en Cat_Servicio a la que se refiere CodigoCat
      as: 'categoria', // Alias para la relación, útil para includes
    });

    // Una Cat_Servicio puede tener muchos Servicios
    Cat_Servicio.hasMany(Servicio, {
      foreignKey: 'CodigoCat',
      sourceKey: 'CodigoCatS', // Clave en Cat_Servicio que es referenciada
      as: 'servicios', // Alias para la relación inversa
    });


    export default Servicio;