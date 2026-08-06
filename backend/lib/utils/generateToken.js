import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
	const isProd = process.env.NODE_ENV === "production";

	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

	res.cookie("jwt", token, {
		maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
		httpOnly: true, // Prevents JS access (XSS protection)
		secure: isProd, // Only require HTTPS in production
		sameSite: isProd ? "none" : "lax", // Allow cross-site in production, relaxed in dev
	});
};
