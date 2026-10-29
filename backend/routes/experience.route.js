import express from "express";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { improveDraft } from "../lib/draftImprover.js";
import { searchFilter } from "../lib/searchFilter.js";

const router = express.Router();
const publicUser = "username fullName profileImg coverImg bio link followers following createdAt";
const populatePost = query => query.populate("user", publicUser).populate("comments.user", publicUser);
const guarded = handler => async (req, res) => {
  try { await handler(req, res); }
  catch (error) {
    const status = error.name === "CastError" ? 400 : error.status || 500;
    res.status(status).json({ error: status === 400 ? "Invalid request." : status === 500 ? "Something went wrong. Please try again." : error.message });
  }
};
router.use(protectRoute);

router.get("/search", guarded(async (req, res) => {
  const filter = searchFilter(req.query.q);
  if (!filter) return res.status(400).json({ error: "Search using 2 to 80 characters." });
  const [users, posts] = await Promise.all([
    User.find({ $or: [{ username: filter.person }, { fullName: filter.person }] }).select(publicUser).sort({ username: 1 }).limit(20),
    populatePost(Post.find({ text: filter.post }).sort({ createdAt: -1 }).limit(20)),
  ]);
  res.json({ users, posts, query: filter.query, limit: 20 });
}));

router.get("/posts/saved", guarded(async (req, res) => {
  const posts = await populatePost(Post.find({ _id: { $in: req.user.bookmarks || [] } }).sort({ createdAt: -1 }));
  res.json(posts);
}));
router.put("/posts/:id/bookmark", guarded(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id) || typeof req.body.saved !== "boolean") return res.status(400).json({ error: "Provide a valid post and saved status." });
  if (!await Post.exists({ _id: req.params.id })) return res.status(404).json({ error: "Post not found." });
  const operation = req.body.saved ? { $addToSet: { bookmarks: req.params.id } } : { $pull: { bookmarks: req.params.id } };
  const user = await User.findByIdAndUpdate(req.user._id, operation, { new: true }).select("bookmarks");
  res.json({ bookmarks: user.bookmarks });
}));
router.get("/posts/detail/:id", guarded(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ error: "Invalid post ID." });
  const post = await populatePost(Post.findById(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found." });
  res.json(post);
}));
router.get("/users/:username/stats", guarded(async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).select("_id");
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ postCount: await Post.countDocuments({ user: user._id }) });
}));
router.get("/users/:username/connections", guarded(async (req, res) => {
  const type = req.query.type;
  if (!["followers", "following"].includes(type)) return res.status(400).json({ error: "Choose followers or following." });
  const page = Number(req.query.page || 0);
  if (!Number.isSafeInteger(page) || page < 0 || page > 10000) return res.status(400).json({ error: "Invalid page." });
  const user = await User.findOne({ username: req.params.username }).select(type);
  if (!user) return res.status(404).json({ error: "User not found." });
  const ids = user[type] || [];
  const users = await User.find({ _id: { $in: ids.slice(page * 50, (page + 1) * 50) } }).select(publicUser);
  res.json({ users, hasMore: (page + 1) * 50 < ids.length });
}));
router.patch("/notifications/read", guarded(async (req, res) => {
  await Notification.updateMany({ to: req.user._id, read: false }, { $set: { read: true } });
  res.json({ message: "All notifications marked as read." });
}));

// Small per-user limit for this single-server app; no additional infrastructure.
const rewriteWindows = new Map();
router.post("/ai/improve", guarded(async (req, res) => {
  const now = Date.now();
  for (const [id, window] of rewriteWindows) if (window.until <= now) rewriteWindows.delete(id);
  const id = String(req.user._id);
  const window = rewriteWindows.get(id) || { count: 0, until: now + 60000 };
  if (window.count >= 5) { res.setHeader("Retry-After", Math.ceil((window.until - now) / 1000)); return res.status(429).json({ error: "Please wait a minute before improving another draft." }); }
  window.count++; rewriteWindows.set(id, window);
  const result = await improveDraft(req.body.text);
  res.setHeader("Cache-Control", "no-store");
  res.json(result);
}));

export default router;
