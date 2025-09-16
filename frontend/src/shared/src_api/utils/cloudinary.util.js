const cloudinary = require("../config/cloudinary.config");

const deleteByPublicId = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

module.exports = { deleteByPublicId, extractPublicIdFromUrl };
