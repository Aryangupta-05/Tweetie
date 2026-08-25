import cron from "node-cron";
import Post from "../models/post.model.js";

/**
 * TRENDING SCORE FORMULA (HackerNews Time-Decay Model):
 *
 *   Score = ((Likes × 1) + (Comments × 5)) / (AgeInHours + 2)^1.5
 *
 *  - Comments are worth 5× more than likes (they drive more engagement)
 *  - Dividing by age means older posts sink to the bottom automatically
 *  - The ^1.5 exponent (gravity) accelerates the decay over time
 *  - Adding +2 prevents division-by-zero for brand new posts
 *
 * This runs every 10 minutes in the background.
 * MongoDB does ALL the math internally — Node.js just triggers the job.
 */

const updateTrendingScores = async () => {
	console.log("🔄 [Ranker] Running trending score calculation...");
	try {
		const now = new Date();

		await Post.updateMany({}, [
			{
				$set: {
					trendingScore: {
						$divide: [
							// TOP HALF: (Likes × 1) + (Comments × 5)
							{
								$add: [
									{ $size: "$likes" }, // likes count × 1
									{ $multiply: [{ $size: "$comments" }, 5] }, // comments count × 5
								],
							},
							// BOTTOM HALF: (AgeInHours + 2) ^ 1.5
							{
								$pow: [
									{
										$add: [
											{
												// Convert milliseconds → hours
												$divide: [
													{
														$subtract: [
															now, // current time
															"$createdAt", // post creation time
														],
													},
													1000 * 60 * 60, // ms in 1 hour
												],
											},
											2, // +2 to avoid division by zero
										],
									},
									1.5, // gravity exponent
								],
							},
						],
					},
				},
			},
		]);

		console.log("✅ [Ranker] Trending scores updated successfully.");
	} catch (error) {
		console.error("❌ [Ranker] Error updating trending scores:", error.message);
	}
};

const startRankerJob = () => {
	// Run IMMEDIATELY on startup so existing posts get scores right away
	updateTrendingScores();

	// Then keep running every 10 minutes: "*/10 * * * *"
	cron.schedule("*/10 * * * *", updateTrendingScores);

	console.log("⏰ [Ranker] Background ranking job scheduled (every 10 minutes).");
};

export default startRankerJob;
