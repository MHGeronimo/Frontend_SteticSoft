import { DataTypes } from "sequelize";
import sequelize from "../db.js"; // Asegúrate de que esta ruta sea correcta
import Cat_Producto from "./catproducto.model.js"; // Importa el modelo de Cat_Producto

const Producto = sequelize.define("Producto", {
  ID_producto: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(100), // Nombre del producto
    allowNull: false,
    unique: true, // Asegura que no haya dos productos con el mismo nombre
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2), // Precio con 2 decimales
    allowNull: false,
    validate: {
      min: 0, // El precio no puede ser negativo
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  marca: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  estadoAI: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // 1 para activo, 0 para inactivo
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT, // Para una descripción detallada
    allowNull: true,     // La descripción puede ser opcional
  },
  // Nuevo campo para guardar la URL de la imagen
  Imagenes: {
    type: DataTypes.STRING(255), // Un VARCHAR(255) es adecuado para URLs
    allowNull: true,              // El campo es opcional
  },
  IDCat_producto: { // Usa el nombre exacto de la base de datos
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Cat_Producto,
      key: 'IDCat_producto',
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  },
}, {
  tableName: "producto", // Nombre de la tabla en la base de datos
  timestamps: false,     // No se crean las columnas createdAt y updatedAt
});

// Definir la relación (asociación)
// Un Producto pertenece a una Cat_Producto
Producto.belongsTo(Cat_Producto, {
  foreignKey: 'IDCat_producto',
  targetKey: 'IDCat_producto',
  as: 'categoria',
});

// Una Cat_Producto puede tener muchos Productos
Cat_Producto.hasMany(Producto, {
  foreignKey: 'IDCat_producto',
  sourceKey: 'IDCat_producto', // Clave en Cat_Producto que es referenciada
  as: 'productos', // Alias para la relación inversa
});

export default Producto;