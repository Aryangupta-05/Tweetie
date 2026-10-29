import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { uploadMedia, deleteMedia } from "../lib/mediaUpload.js";

export const createPost = async (req, res) => {
	try {
		const { text } = req.body;
		let { img } = req.body;
		const userId = req.user._id.toString();
		if (text !== undefined && (typeof text !== "string" || text.length > 500)) return res.status(400).json({ error: "Posts can contain up to 500 characters." });
		if (img && (typeof img !== "string" || !/^data:image\/(png|jpeg|webp|gif);base64,/.test(img) || Buffer.byteLength(img.split(",")[1] || "", "base64") > 4 * 1024 * 1024)) return res.status(400).json({ error: "Choose a PNG, JPEG, WebP or GIF image up to 4 MB." });

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (!text?.trim() && !img) {
			return res.status(400).json({ error: "Post must have text or image" });
		}

		if (img) {
			img = await uploadMedia(img, "posts");
		}

		const newPost = new Post({
			user: userId,
			text,
			img,
		});

		await newPost.save();
		res.status(201).json(newPost);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
		console.log("Error in createPost controller: ", error);
	}
};

export const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "You are not authorized to delete this post" });
		}

		if (post.img) {
			await deleteMedia(post.img);
		}

		await Post.findByIdAndDelete(req.params.id);
		await User.updateMany({ $or: [{ bookmarks: post._id }, { likedPosts: post._id }] }, { $pull: { bookmarks: post._id, likedPosts: post._id } });

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.log("Error in deletePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const commentOnPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;

		if (typeof text !== "string" || !text.trim() || text.length > 500) {
			return res.status(400).json({ error: "Text field is required" });
		}
		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const comment = { user: userId, text };

		post.comments.push(comment);
		await post.save();

		res.status(200).json(post);
	} catch (error) {
		console.log("Error in commentOnPost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const likeUnlikePost = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id: postId } = req.params;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

			const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
			res.status(200).json(updatedLikes);
		} else {
			// Like post
			post.likes.push(userId);
			await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
			await post.save();

			const notification = new Notification({
				from: userId,
				to: post.user,
				type: "like",
			});
			await notification.save();

			const updatedLikes = post.likes;
			res.status(200).json(updatedLikes);
		}
	} catch (error) {
		console.log("Error in likeUnlikePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getAllPosts = async (req, res) => {
	try {
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "username fullName profileImg coverImg bio link followers following createdAt",
			})
			.populate({
				path: "comments.user",
				select: "username fullName profileImg coverImg bio link followers following createdAt",
			});

		if (posts.length === 0) {
			return res.status(200).json([]);
		}

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getAllPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * FOR YOU FEED — Ranked by trendingScore (pre-calculated by the background Cron job)
 * Formula: ((Likes × 1) + (Comments × 5)) / (AgeInHours + 2)^1.5
 * This route is O(1) fast — no math here, just read the pre-saved score!
 */
export const getForYouPosts = async (req, res) => {
	try {
		const posts = await Post.find()
			.sort({ trendingScore: -1 }) // Highest score first
			.limit(20) // Top 20 trending posts
			.populate({ path: "user", select: "username fullName profileImg coverImg bio link followers following createdAt" })
			.populate({ path: "comments.user", select: "username fullName profileImg coverImg bio link followers following createdAt" });

		if (posts.length === 0) return res.status(200).json([]);
		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getForYouPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getLikedPosts = async (req, res) => {
	const userId = req.params.id;

	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
			.populate({
				path: "user",
				select: "username fullName profileImg coverImg bio link followers following createdAt",
			})
			.populate({
				path: "comments.user",
				select: "username fullName profileImg coverImg bio link followers following createdAt",
			});

		res.status(200).json(likedPosts);
	} catch (error) {
		console.log("Error in getLikedPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getFollowingPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const following = user.following;

		const feedPosts = await Post.find({ user: { $in: following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "username fullName profileImg coverImg bio link followers following createdAt",
			})
			.populate({
				path: "comments.user",
				select: "username fullName profileImg coverImg bio link followers following createdAt",
			});

		res.status(200).json(feedPosts);
	} catch (error) {
		console.log("Error in getFollowingPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getUserPosts = async (req, res) => {
	try {
		const { username } = req.params;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ error: "User not found" });

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "username fullName profileImg coverImg bio link followers following createdAt",
			})
			.populate({
				path: "comments.user",
				select: "username fullName profileImg coverImg bio link followers following createdAt",
			});

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
