import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiArrowLeft, FiArrowUpRight, FiEdit3, FiFeather, FiLink } from "react-icons/fi";
import { Avatar, Empty, Heading, Modal, QueryState } from "./shared";
import { request } from "./api";
import { readImage, safeLink } from "./utils";
import { useAction } from "./hooks";
import FollowButton from "./FollowButton";
import PostCard from "./PostCard";

function Connections({ person, type, user }) {
  const query = useInfiniteQuery({ queryKey: ["connections", user._id, person.username, type], queryFn: ({ signal, pageParam }) => request(`/users/${encodeURIComponent(person.username)}/connections?type=${type}&page=${pageParam}`, { signal }), initialPageParam: 0, getNextPageParam: (last, pages) => last.hasMore ? pages.length : undefined });
  const people = query.data?.pages.flatMap(page => page.users) || [];
  return <div className="td-modal-content"><QueryState query={query}>{people.map(item => <div className="td-person-row" key={item._id}><Avatar person={item} linked /><Link className="td-person-info" to={`/profile/${encodeURIComponent(item.username)}`}><strong>{item.fullName}</strong><span>@{item.username}</span></Link><FollowButton person={item} user={user} /></div>)}{query.isSuccess && !people.length && <p className="td-subtle">No {type} yet.</p>}{query.hasNextPage && <button className="td-text-button" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? "Loading…" : "Load more"}</button>}</QueryState></div>;
}

function EditProfile({ user, close }) {
  const [images, setImages] = useState({});
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const save = useAction(payload => request("/users/update", { method: "POST", body: payload }), data => { toast.success("Profile updated"); close(); navigate(`/profile/${encodeURIComponent(data.username)}`, { replace: true }); });
  async function imageChange(event, field) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    setReading(true); setError("");
    try { const image = await readImage(file, 2); setImages(current => ({ ...current, [field]: image })); } catch (problem) { setError(problem.message); } finally { setReading(false); }
  }
  return <form className="td-modal-content td-edit-form" onSubmit={event => { event.preventDefault(); if (reading || save.isPending) return; const fields = Object.fromEntries(new FormData(event.currentTarget)); delete fields.profileFile; delete fields.coverFile; if (!fields.currentPassword && !fields.newPassword) { delete fields.currentPassword; delete fields.newPassword; } save.mutate({ ...fields, ...images }); }}><div className="tl-edit-images"><label htmlFor="edit-profile-image">Profile photo (up to 2 MB)<input id="edit-profile-image" name="profileFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={reading || save.isPending} onChange={event => imageChange(event, "profileImg")} /></label>{images.profileImg && <img src={images.profileImg} className="tl-edit-avatar" alt="New profile photo preview" />}<label htmlFor="edit-cover-image">Cover image (up to 2 MB)<input id="edit-cover-image" name="coverFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={reading || save.isPending} onChange={event => imageChange(event, "coverImg")} /></label>{images.coverImg && <img src={images.coverImg} className="tl-edit-cover" alt="New cover preview" />}</div><label htmlFor="edit-fullName">Display name<input id="edit-fullName" name="fullName" defaultValue={user.fullName} required pattern=".*\S.*" maxLength={60} disabled={save.isPending} /></label><label htmlFor="edit-username">Username<input id="edit-username" name="username" defaultValue={user.username} required pattern="[A-Za-z0-9_]+" maxLength={30} disabled={save.isPending} /></label><label htmlFor="edit-email">Email address<input id="edit-email" name="email" type="email" defaultValue={user.email} required maxLength={254} disabled={save.isPending} /></label><label htmlFor="edit-bio">Bio<textarea id="edit-bio" name="bio" defaultValue={user.bio} maxLength={180} rows={3} disabled={save.isPending} /></label><label htmlFor="edit-link">Website<input id="edit-link" name="link" type="url" defaultValue={user.link} placeholder="https://your-website.com" maxLength={300} disabled={save.isPending} /></label><details className="tl-password-settings"><summary>Change password</summary><label htmlFor="edit-current-password">Current password<input id="edit-current-password" type="password" name="currentPassword" autoComplete="current-password" maxLength={128} disabled={save.isPending} /></label><label htmlFor="edit-new-password">New password<input id="edit-new-password" type="password" name="newPassword" autoComplete="new-password" minLength={6} maxLength={128} disabled={save.isPending} /></label></details>{reading && <p role="status">Preparing your image…</p>}{error && <p className="td-form-error" role="alert">{error}</p>}{save.isError && <p className="td-form-error" role="alert">{save.error.message}</p>}<button className="td-button td-button-primary" disabled={reading || save.isPending}>{save.isPending ? "Saving…" : "Save changes"}<FiArrowUpRight /></button></form>;
}

export default function ProfilePage({ user }) {
  const { username } = useParams();
  const [modal, setModal] = useState(null);
  const profile = useQuery({ queryKey: ["profile", user._id, username], queryFn: ({ signal }) => request(`/users/profile/${encodeURIComponent(username)}`, { signal }) });
  const posts = useQuery({ queryKey: ["posts", user._id, "profile", username], queryFn: ({ signal }) => request(`/posts/user/${encodeURIComponent(username)}`, { signal }) });
  const stats = useQuery({ queryKey: ["stats", user._id, username], queryFn: ({ signal }) => request(`/users/${encodeURIComponent(username)}/stats`, { signal }) });
  const person = profile.data;
  const own = person?._id === user._id;
  const website = safeLink(person?.link);
  return <><Heading eyebrow="THE PEOPLE BEHIND THE POSTS" title="Profile" action={<Link to="/" className="td-icon-button" aria-label="Back to feed"><FiArrowLeft /></Link>} /><QueryState query={profile}>{person && <><div className="td-profile-cover">{person.coverImg ? <img className="tl-profile-cover-img" src={person.coverImg} alt={`${person.fullName}'s cover`} /> : <><span>Always a work in progress.</span><FiFeather /></>}</div><section className="td-profile-info"><div className="td-profile-top"><Avatar person={person} size="td-avatar-large" />{own ? <button className="td-button td-button-outline" onClick={() => setModal("edit")}>Edit profile <FiEdit3 /></button> : <FollowButton person={person} user={user} full />}</div><h2>{person.fullName}</h2><span className="td-handle">@{person.username}</span>{person.bio && <p>{person.bio}</p>}<div className="td-profile-meta">{website && <a href={website} target="_blank" rel="noopener noreferrer"><FiLink />{new URL(website).hostname}<FiArrowUpRight /></a>}<span>Joined {new Date(person.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span></div><div className="td-profile-stats"><button onClick={() => setModal("following")}><strong>{person.following?.length || 0}</strong> Following</button><button onClick={() => setModal("followers")}><strong>{person.followers?.length || 0}</strong> Followers</button><span><strong>{stats.data?.postCount ?? posts.data?.length ?? "—"}</strong> Posts</span></div></section><div className="td-section-label">Posts <span>{stats.data?.postCount ?? posts.data?.length ?? "—"}</span></div><QueryState query={posts}>{posts.data?.length ? posts.data.map(post => <PostCard key={post._id} post={post} user={user} />) : <Empty title="A fresh start">Posts from this profile will appear here.</Empty>}</QueryState>{modal && <Modal key={`${username}-${modal}`} title={modal === "edit" ? "Edit profile" : modal === "followers" ? "Followers" : "Following"} close={() => setModal(null)}>{modal === "edit" ? <EditProfile user={user} close={() => setModal(null)} /> : <Connections person={person} type={modal} user={user} />}</Modal>}</>}</QueryState></>;
}
