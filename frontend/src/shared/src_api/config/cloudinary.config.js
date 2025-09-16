// src/config/cloudinary.config.js
const cloudinary = require("cloudinary").v2;
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = require("./env.config.js");

const DEFAULT_FOLDER = "steticsoft";

// Configurar Cloudinary con las credenciales del entorno
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true, // Usar HTTPS
});

/**
 * Sube un archivo a Cloudinary desde un buffer de memoria.
 * @param {Buffer} fileBuffer - El buffer del archivo a subir.
 * @param {string} [folder=DEFAULT_FOLDER] - Carpeta destino en Cloudinary.
 * @returns {Promise<object>} - Resultado de la subida.
 */
const uploadImage = (fileBuffer, folder = DEFAULT_FOLDER) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    return Promise.reject(
      new Error("El parámetro fileBuffer debe ser un Buffer válido.")
    );
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            return reject(
              new Error(`Error al subir imagen a Cloudinary: ${error.message}`)
            );
          }
          resolve(result);
        }
      )
      .end(fileBuffer);
  });
};

/**
 * Elimina una imagen de Cloudinary usando su public_id.
 * @param {string} publicId - El ID público de la imagen a eliminar.
 * @returns {Promise<object>} - Resultado de la eliminación.
 */
const deleteImage = async (publicId) => {
  if (!publicId || typeof publicId !== "string") {
    throw new Error("El parámetro publicId debe ser un string válido.");
  }
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error al eliminar la imagen de Cloudinary:", error);
    throw new Error(`No se pudo eliminar la imagen: ${error.message}`);
  }
};

/**
 * Extrae el public_id de una URL de Cloudinary.
 * @param {string} imagen - La URL completa de la imagen.
 * @returns {string|null} - El public_id o null si no se puede extraer.
 */
const getPublicIdFromUrl = (imagen) => {
  if (
    !imagen ||
    typeof imagen !== "string" ||
    !imagen.includes("cloudinary.com")
  ) {
    return null;
  }
  try {
    // Ejemplo de URL: https://res.cloudinary.com/demo/image/upload/v123456789/folder/file.jpg
    const url = new URL(imagen);
    const pathParts = url.pathname.split("/").filter(Boolean); // Elimina vacíos
    // Buscar el índice de 'upload' para obtener la ruta relativa
    const uploadIdx = pathParts.indexOf("upload");
    if (uploadIdx === -1 || uploadIdx + 1 >= pathParts.length) return null;
    // El public_id es todo lo que sigue después de la versión (v...)
    const afterVersion = pathParts.slice(uploadIdx + 2).join("/"); // +2 para saltar 'upload' y 'v...'
    return afterVersion.split(".")[0]; // Sin extensión
  } catch (error) {
    console.error("No se pudo extraer el public_id de la URL:", imagen);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getPublicIdFromUrl,
};
