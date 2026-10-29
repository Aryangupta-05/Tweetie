import bcrypt from "bcryptjs";
import { uploadMedia, deleteMedia } from "../lib/mediaUpload.js";

// models
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getUserProfile = async (req, res) => {
	try {
		const { username } = req.params;
		console.log("Requested profile for:", username);

		const user = await User.findOne({ username }).select("-password -email -bookmarks -likedPosts");
		
		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user);
	} catch (error) {
		console.log("Error in getUserProfile: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const followUnfollowUser = async (req, res) => {
	try {
		const { id } = req.params;
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (id === req.user._id.toString()) {
			return res.status(400).json({ error: "You can't follow/unfollow yourself" });
		}

		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

		const isFollowing = currentUser.following.includes(id);

		if (isFollowing) {
			// Unfollow the user
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

			res.status(200).json({ message: "User unfollowed successfully" });
		} else {
			// Follow the user
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
			// Send notification to the user
			const newNotification = new Notification({
				type: "follow",
				from: req.user._id,
				to: userToModify._id,
			});

			await newNotification.save();

			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (error) {
		console.log("Error in followUnfollowUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const getSuggestedUsers = async (req, res) => {
	try {
		const userId = req.user._id;

		const usersFollowedByMe = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{ $sample: { size: 10 } },
			{ $project: { password: 0, email: 0, bookmarks: 0, likedPosts: 0 } },
		]);

		// 1,2,3,4,5,6,
		const filteredUsers = users.filter((user) => !usersFollowedByMe.following.some(id => String(id) === String(user._id)));
		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		console.log("Error in getSuggestedUsers: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const updateUser = async (req, res) => {
	const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });
		if (username !== undefined && (typeof username !== "string" || !/^[A-Za-z0-9_]{1,30}$/.test(username))) return res.status(400).json({ error: "Use up to 30 letters, numbers or underscores for your username." });
		if (fullName !== undefined && (typeof fullName !== "string" || !fullName.trim() || fullName.length > 60)) return res.status(400).json({ error: "Enter a name up to 60 characters." });
		if (bio !== undefined && (typeof bio !== "string" || bio.length > 180)) return res.status(400).json({ error: "Keep your bio within 180 characters." });
		if (email !== undefined && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return res.status(400).json({ error: "Enter a valid email address." });
		if (link && (typeof link !== "string" || !/^https?:\/\/\S+$/i.test(link))) return res.status(400).json({ error: "Use a website beginning with https:// or http://." });
		const oldProfile = user.profileImg;
		const oldCover = user.coverImg;

		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both current password and new password" });
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters long" });
			}

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		if (profileImg) {
			profileImg = await uploadMedia(profileImg, "profiles");
		}

		if (coverImg) {
			coverImg = await uploadMedia(coverImg, "covers");
		}

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio !== undefined ? bio.trim() : user.bio;
		user.link = link !== undefined ? link.trim() : user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();
		if (profileImg && oldProfile && oldProfile !== profileImg) await deleteMedia(oldProfile);
		if (coverImg && oldCover && oldCover !== coverImg) await deleteMedia(oldCover);

		// password should be null in response
		user.password = null;

		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(error.code === 11000 ? 409 : 500).json({ error: error.code === 11000 ? "That username or email is already in use." : "Could not update your profile. Please try again." });
	}
};
