import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client with AWS credentials from environment variables
const s3Client = new S3Client({
	region: process.env.AWS_REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
	},
});

/**
 * Checks whether AWS S3 credentials and bucket name are configured.
 */
export const isS3Configured = () => {
	return Boolean(
		process.env.AWS_BUCKET_NAME &&
		process.env.AWS_ACCESS_KEY_ID &&
		process.env.AWS_SECRET_ACCESS_KEY
	);
};

/**
 * Uploads a base64 encoded image to an Amazon S3 Bucket.
 * @param {string} base64String - Data URI (data:image/png;base64,...) or raw base64 string
 * @param {string} folder - Target folder in bucket (e.g. "posts", "profiles", "covers")
 * @returns {Promise<string>} Public S3 URL of the uploaded image
 */
export const uploadToS3 = async (base64String, folder = "posts") => {
	const bucketName = process.env.AWS_BUCKET_NAME;
	const region = process.env.AWS_REGION || "us-east-1";

	if (!bucketName) {
		throw new Error("AWS_BUCKET_NAME environment variable is not configured.");
	}

	// Detect content type and extract raw base64 data
	let contentType = "image/jpeg";
	let base64Data = base64String;
	let extension = "jpg";

	if (base64String.includes(";base64,")) {
		const parts = base64String.split(";base64,");
		const mimeMatch = parts[0].match(/:(.*?)$/);
		if (mimeMatch && mimeMatch[1]) {
			contentType = mimeMatch[1];
			extension = contentType.split("/")[1] || "jpg";
			if (extension === "jpeg") extension = "jpg";
		}
		base64Data = parts[1];
	}

	const buffer = Buffer.from(base64Data, "base64");
	const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;

	const uploadParams = {
		Bucket: bucketName,
		Key: fileName,
		Body: buffer,
		ContentType: contentType,
	};

	await s3Client.send(new PutObjectCommand(uploadParams));

	// Return standard S3 public object URL
	return `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
};

/**
 * Deletes an object from Amazon S3 given its public URL.
 * @param {string} fileUrl - S3 URL of the object to delete
 */
export const deleteFromS3 = async (fileUrl) => {
	const bucketName = process.env.AWS_BUCKET_NAME;
	if (!bucketName || !fileUrl) return;

	try {
		// Extract object Key from S3 URL
		const urlObj = new URL(fileUrl);
		// pathname begins with a '/', e.g. "/posts/123-abc.jpg"
		const key = urlObj.pathname.startsWith("/")
			? urlObj.pathname.substring(1)
			: urlObj.pathname;

		await s3Client.send(
			new DeleteObjectCommand({
				Bucket: bucketName,
				Key: key,
			})
		);
	} catch (error) {
		console.error("Error deleting file from S3:", error.message);
	}
};

export default s3Client;
