import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiArrowUpRight, FiBookmark, FiHeart, FiLink, FiMessageCircle, FiMoreHorizontal, FiSend, FiTrash2 } from "react-icons/fi";
import { Avatar, Modal, QueryState } from "./shared";
import { request } from "./api";
import { containsId, idOf, shortDate } from "./utils";
import { useAction } from "./hooks";

function PostText({ text = "" }) {
  return <p className="td-post-text">{text.split(/(#[\p{L}\p{N}_]+)/u).map((part, index) => /^#[\p{L}\p{N}_]+$/u.test(part) ? <Link className="tl-hashtag" key={index} to={`/explore?q=${encodeURIComponent(part)}`}>{part}</Link> : part)}</p>;
}

export default function PostCard({ post, user, detail = false }) {
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(null);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const client = useQueryClient();
  const author = post.user || { fullName: "Former member" };
  const owned = idOf(author) === idOf(user);
  const saved = containsId(user.bookmarks, post._id);
  const liked = containsId(post.likes, user._id);
  const likes = useAction(() => request(`/posts/like/${post._id}`, { method: "POST" }));
  const bookmark = useAction(() => request(`/posts/${post._id}/bookmark`, { method: "PUT", body: { saved: !saved } }), data => {
    client.setQueryData(["authUser"], current => ({ ...current, bookmarks: data.bookmarks }));
    toast.success(saved ? "Removed from saved posts" : "Post saved");
  });
  const deletion = useAction(() => request(`/posts/${post._id}`, { method: "DELETE" }), () => { setModal(null); toast.success("Post deleted"); if (detail) navigate("/"); });
  const reply = useAction(text => request(`/posts/comment/${post._id}`, { method: "POST", body: { text } }), () => { setComment(""); toast.success("Reply added"); });
  const replies = useQuery({ queryKey: ["posts", user._id, "detail", post._id], queryFn: ({ signal }) => request(`/posts/detail/${post._id}`, { signal }), enabled: modal === "replies" });
  async function share() {
    const url = `${window.location.origin}/post/${post._id}`;
    try { await navigator.clipboard.writeText(url); toast.success("Post link copied"); } catch { setModal("share"); }
    setMenu(false);
  }
  return <article className={`td-post ${detail ? "td-post-detail" : ""}`}><Avatar person={author} linked /><div className="td-post-body"><div className="td-post-heading"><div className="td-post-author"><Link className="td-name" to={author.username ? `/profile/${encodeURIComponent(author.username)}` : "/"}>{author.fullName || author.username}</Link>{author.username && <Link className="td-handle" to={`/profile/${encodeURIComponent(author.username)}`}>@{author.username}</Link>}<time className="td-time" dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString()}>· {shortDate(post.createdAt)}</time></div><div className="td-post-menu-wrap" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setMenu(false); }}><button className="td-icon-button" aria-label={`More options for ${author.fullName || author.username}'s post`} aria-expanded={menu} onClick={() => setMenu(!menu)}><FiMoreHorizontal /></button>{menu && <div className="td-post-menu"><button onClick={share}><FiLink /> Copy post link</button>{owned && <button className="td-danger" onClick={() => { setMenu(false); setModal("delete"); }}><FiTrash2 /> Delete post</button>}</div>}</div></div><PostText text={post.text} />{post.img && <a className="tl-post-image-link" href={post.img} target="_blank" rel="noopener noreferrer" aria-label="Open attached image in a new tab"><img className="tl-post-image" src={post.img} alt="Image attached to this post" loading="lazy" /></a>}<div className="td-post-actions"><button aria-label={`Reply, ${post.comments?.length || 0} comments`} onClick={() => setModal("replies")}><FiMessageCircle /><span>{post.comments?.length || 0}</span></button><button role="checkbox" aria-checked={liked} aria-label={`${liked ? "Unlike" : "Like"} post, ${post.likes?.length || 0} likes`} className={liked ? "is-liked" : ""} disabled={likes.isPending} onClick={() => likes.mutate()}><FiHeart /><span>{post.likes?.length || 0}</span></button><Link to={`/post/${post._id}`} aria-label="Open post"><FiArrowUpRight /><span>Open</span></Link><button role="checkbox" aria-checked={saved} aria-label={saved ? "Unsave post" : "Save post"} className={saved ? "is-saved" : ""} disabled={bookmark.isPending} onClick={() => bookmark.mutate()}><FiBookmark /></button><button aria-label="Share post" onClick={share}><FiSend /></button></div>{detail && <section className="tl-detail-replies" aria-label="Replies">{post.comments?.map(item => <div className="td-reply" key={item._id}><Avatar person={item.user} linked /><div><span className="td-name">{item.user?.fullName || item.user?.username || "Former member"}</span><p>{item.text}</p></div></div>)}<button className="td-text-button" onClick={() => setModal("replies")}>Join the conversation <FiMessageCircle /></button></section>}</div>
    {modal && <Modal title={modal === "replies" ? "The conversation" : modal === "delete" ? "Delete this post?" : "Share this post"} close={() => { if (!deletion.isPending && !reply.isPending) setModal(null); }}>
      {modal === "replies" && <div className="td-modal-content"><p className="td-comment-context">{post.text}</p><QueryState query={replies}>{replies.data?.comments?.map(item => <div className="td-reply" key={item._id}><Avatar person={item.user} linked /><div><span className="td-name">{item.user?.fullName || item.user?.username || "Former member"}</span><p>{item.text}</p></div></div>)}{replies.data?.comments?.length === 0 && <p className="td-subtle">Be the first to join the conversation.</p>}</QueryState><form onSubmit={event => { event.preventDefault(); if (comment.trim() && !reply.isPending) reply.mutate(comment.trim()); }}><label htmlFor={`reply-${post._id}`} className="td-field-label">Your reply</label><textarea id={`reply-${post._id}`} className="td-comment-input" placeholder="Add to the conversation…" value={comment} onChange={event => setComment(event.target.value)} maxLength={500} required disabled={reply.isPending} />{reply.isError && <p className="td-form-error" role="alert">{reply.error.message}</p>}<button className="td-button td-button-primary" disabled={!comment.trim() || reply.isPending}>{reply.isPending ? "Posting…" : "Post reply"}<FiSend /></button></form></div>}
      {modal === "delete" && <div className="td-modal-content"><p>This permanently removes your post and its replies.</p>{deletion.isError && <p className="td-form-error" role="alert">{deletion.error.message}</p>}<div className="td-modal-buttons"><button className="td-button td-button-outline" disabled={deletion.isPending} onClick={() => setModal(null)}>Keep post</button><button className="td-button td-button-primary" disabled={deletion.isPending} onClick={() => deletion.mutate()}>{deletion.isPending ? "Deleting…" : "Delete post"}</button></div></div>}
      {modal === "share" && <div className="td-modal-content"><label className="td-field-label" htmlFor={`share-${post._id}`}>Copy this link</label><input id={`share-${post._id}`} className="td-share-input" value={`${window.location.origin}/post/${post._id}`} readOnly onFocus={event => event.target.select()} /></div>}
    </Modal>}
  </article>;
}
