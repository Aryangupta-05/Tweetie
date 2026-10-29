import { v2 as cloudinary } from "cloudinary";
import { uploadToS3, deleteFromS3, isS3Configured } from "./s3.js";

/**
 * Uploads an image to AWS S3 if credentials are set, or falls back to Cloudinary.
 * @param {string} imageString - Base64 encoded image string or URL
 * @param {string} folder - Target category/folder ("posts", "profiles", "covers")
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export const uploadMedia = async (imageString, folder = "posts") => {
	if (!imageString) return null;

	if (isS3Configured()) {
		return await uploadToS3(imageString, folder);
	}

	// Fallback to Cloudinary
	const uploadedResponse = await cloudinary.uploader.upload(imageString);
	return uploadedResponse.secure_url;
};

/**
 * Deletes an image from AWS S3 or Cloudinary depending on its URL.
 * @param {string} imageUrl - Public image URL to delete
 */
export const deleteMedia = async (imageUrl) => {
	if (!imageUrl) return;

	// If it's an AWS S3 URL
	if (imageUrl.includes("amazonaws.com")) {
		await deleteFromS3(imageUrl);
		return;
	}

	// Cloudinary deletion
	try {
		const publicId = imageUrl.split("/").pop().split(".")[0];
		if (publicId) {
			await cloudinary.uploader.destroy(publicId);
		}
	} catch (error) {
		console.error("Error deleting from Cloudinary:", error.message);
	}
};
