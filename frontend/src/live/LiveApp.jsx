import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { FiArrowRight, FiArrowUpRight, FiBell, FiBookmark, FiCheck, FiCode, FiCompass, FiEdit3, FiFeather, FiGithub, FiHome, FiLogOut, FiPlus, FiSearch, FiUser, FiUsers, FiZap } from "react-icons/fi";
import CreatorLinks from "./CreatorLinks";
import { creator } from "./creator";
import { Avatar, Brand, Empty, Heading, Modal, QueryState } from "./shared";
import { request } from "./api";
import AuthPage from "./AuthPage";
import Composer from "./Composer";
import PostCard from "./PostCard";
import FollowButton from "./FollowButton";
import ProfilePage from "./ProfilePage";
import ExplorePage from "./ExplorePage";
import NotificationsPage from "./NotificationsPage";
import "./base.css";
import "./glass.css";
import "./live.css";

function Feed({ user, draft, setDraft, draftSaved, compose }) {
  const [feed, setFeed] = useState("foryou");
  const query = useQuery({ queryKey: ["posts", user._id, "feed", feed], queryFn: ({ signal }) => request(`/posts/${feed}`, { signal }) });
  return <><Heading eyebrow="YOUR CORNER OF THE INTERNET" title="A little more connected." /><div className="td-welcome"><span className="td-welcome-spark">✳</span><div><span className="td-eyebrow">MAKE YOURSELF AT HOME</span><p>Big ideas start with a small hello.</p></div><button className="td-icon-button" aria-label="Write your first post" onClick={compose}><FiArrowUpRight /></button></div><div className="td-tabs" role="tablist" aria-label="Feed"><button id="live-for-you" role="tab" aria-controls="live-feed" aria-selected={feed === "foryou"} className={feed === "foryou" ? "is-active" : ""} onClick={() => setFeed("foryou")}>For you <FiZap /></button><button id="live-following" role="tab" aria-controls="live-feed" aria-selected={feed === "following"} className={feed === "following" ? "is-active" : ""} onClick={() => setFeed("following")}>Following <FiUsers /></button><span>Ideas worth sharing</span></div><Composer user={user} draft={draft} setDraft={setDraft} draftSaved={draftSaved} /><section id="live-feed" role="tabpanel" aria-labelledby={feed === "foryou" ? "live-for-you" : "live-following"}><QueryState query={query}>{query.data?.length ? query.data.map(post => <PostCard key={post._id} post={post} user={user} />) : <Empty title={feed === "following" ? "Your feed starts with people" : "Start the conversation"}>{feed === "following" ? "Explore the community and follow a few people to build your feed." : "Share a thought, a project, or a small win."}</Empty>}</QueryState></section>{query.isSuccess && query.data?.length > 0 && <div className="td-feed-end"><span><FiCheck /></span>You’re all caught up.<p>Good conversations take a little breathing room.</p></div>}</>;
}
function Saved({ user }) {
  const query = useQuery({ queryKey: ["posts", user._id, "saved"], queryFn: ({ signal }) => request("/posts/saved", { signal }) });
  return <><Heading eyebrow="WORTH COMING BACK TO" title="Your saved posts" /><div className="td-page-intro">Good ideas, kept close.</div><QueryState query={query}>{query.data?.length ? query.data.map(post => <PostCard key={post._id} post={post} user={user} />) : <Empty title="Keep a good idea for later">Tap the bookmark on a post to start your collection.</Empty>}</QueryState></>;
}
function PostDetail({ user }) {
  const { id } = useParams();
  const query = useQuery({ queryKey: ["posts", user._id, "detail", id], queryFn: ({ signal }) => request(`/posts/detail/${encodeURIComponent(id)}`, { signal }) });
  return <><Heading eyebrow="A LITTLE MORE CONVERSATION" title="Post" /><QueryState query={query}>{query.data && <PostCard key={id} post={query.data} user={user} detail />}</QueryState></>;
}
function Discovery({ user }) {
  const navigate = useNavigate();
  const suggested = useQuery({ queryKey: ["suggested", user._id], queryFn: ({ signal }) => request("/users/suggested", { signal }) });
  return <aside className="td-discovery" aria-label="Discover people and topics"><form className="td-search" onSubmit={event => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get("search") || "").trim(); navigate(`/explore${value ? `?q=${encodeURIComponent(value)}` : ""}`); }}><FiSearch /><input name="search" aria-label="Search Tweetie" placeholder="Search Tweetie" maxLength={80} /><kbd>↵</kbd></form><section className="td-discovery-card"><div className="td-card-heading"><h2>Find your people</h2><FiUsers /></div><p className="td-card-subtitle">A few fresh perspectives for your feed.</p><QueryState query={suggested}>{suggested.data?.map(person => <div className="td-person-row" key={person._id}><Avatar person={person} linked /><Link className="td-person-info" to={`/profile/${encodeURIComponent(person.username)}`}><strong>{person.fullName}</strong><span>@{person.username}</span></Link><FollowButton person={person} user={user} /></div>)}{suggested.data?.length === 0 && <p className="td-subtle">You’re connected with everyone here. Check back as the community grows.</p>}</QueryState><Link className="td-discovery-more" to="/explore">Explore the community <FiArrowRight /></Link></section><section className="td-discovery-card td-topics"><div className="td-card-heading"><h2>In the conversation</h2><FiZap /></div>{[{ tag: "buildinpublic", label: "THE THINGS WE MAKE", text: "Progress over perfection" }, { tag: "design", label: "A LITTLE INSPIRATION", text: "Details make the difference" }, { tag: "opensource", label: "BETTER, TOGETHER", text: "Small contributions. Real impact." }].map((topic, index) => <Link key={topic.tag} to={`/explore?q=${encodeURIComponent(`#${topic.tag}`)}`}><span className="td-topic-number">0{index + 1}</span><div><small>{topic.label}</small><strong>#{topic.tag}</strong><p>{topic.text}</p></div><FiArrowUpRight /></Link>)}</section><section className="td-build-card"><span className="td-small-label"><FiCode /> THE PROJECT</span><h2>Thoughtfully designed.<br />Built to connect.</h2><p>A fresh interface for a full-stack social experience.</p><div><span>React</span><span>Express</span><span>MongoDB</span></div><a href={`${creator.github}/Tweetie`} target="_blank" rel="noopener noreferrer">Explore the source <FiGithub /></a></section><footer className="td-footer"><span>Made for meaningful connections.</span><span>Tweetie © {new Date().getFullYear()} <FiFeather /></span></footer></aside>;
}

function Community({ user }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const draftKey = `tweetie-draft-${user._id}`;
  const [draft, setDraft] = useState(() => { try { return localStorage.getItem(draftKey) || ""; } catch { return ""; } });
  const [draftSaved, setDraftSaved] = useState(true);
  const [compose, setCompose] = useState(false);
  const notifications = useQuery({ queryKey: ["notifications", user._id], queryFn: ({ signal }) => request("/notifications", { signal }), refetchInterval: 60000 });
  const unread = notifications.data?.filter(item => !item.read).length || 0;
  const logout = useMutation({ mutationFn: () => request("/auth/logout", { method: "POST" }), onSuccess: async () => { await client.cancelQueries(); client.clear(); client.setQueryData(["authUser"], null); navigate("/login", { replace: true }); } });
  useEffect(() => { try { if (draft) localStorage.setItem(draftKey, draft); else localStorage.removeItem(draftKey); setDraftSaved(true); } catch { setDraftSaved(false); } }, [draft, draftKey]);
  useEffect(() => { window.scrollTo(0, 0); setCompose(false); }, [location.pathname]);
  const nav = [{ to: "/", label: "Home", icon: FiHome, end: true }, { to: "/explore", label: "Explore", icon: FiCompass }, { to: "/notifications", label: "Notifications", icon: FiBell, badge: unread }, { to: "/saved", label: "Saved posts", icon: FiBookmark }, { to: `/profile/${encodeURIComponent(user.username)}`, label: "Profile", icon: FiUser }];
  return <><div className="td-shell"><aside className="td-sidebar"><Brand /><span className="td-nav-label">YOUR WORKSPACE</span><nav aria-label="Main navigation">{nav.map(({ to, label, icon: Icon, badge, end }) => <NavLink key={label} to={to} end={end} className={({ isActive }) => `td-nav-link ${isActive ? "is-active" : ""}`}><Icon /><span>{label}</span>{badge > 0 && <span className="td-nav-count">{badge}</span>}</NavLink>)}</nav><button className="td-button td-button-primary td-new-post" onClick={() => setCompose(true)}><FiPlus /> Create a post <FiEdit3 /></button><div className="td-sidebar-note"><span className="td-note-icon"><FiFeather /></span><h3>Built for your next idea.</h3><p>A thought, a project, a small win.<br />There’s room for it here.</p><Link to="/explore">Find your inspiration <FiArrowUpRight /></Link></div><div className="td-sidebar-bottom"><CreatorLinks className="td-sidebar-credit" /><Link className="td-account" to={`/profile/${encodeURIComponent(user.username)}`}><Avatar person={user} /><span><strong>{user.fullName}</strong><small>@{user.username}</small></span></Link><button className="td-text-button tl-logout" disabled={logout.isPending} onClick={() => logout.mutate()}><FiLogOut />{logout.isPending ? "Signing out…" : "Sign out"}</button>{logout.isError && <p className="td-form-error" role="alert">{logout.error.message}</p>}</div></aside><main id="td-main" className="td-main" tabIndex={-1}><Routes><Route path="/" element={<Feed user={user} draft={draft} setDraft={setDraft} draftSaved={draftSaved} compose={() => setCompose(true)} />} /><Route path="/explore" element={<ExplorePage user={user} />} /><Route path="/saved" element={<Saved user={user} />} /><Route path="/notifications" element={<NotificationsPage user={user} />} /><Route path="/profile/:username" element={<ProfilePage key={location.pathname} user={user} />} /><Route path="/post/:id" element={<PostDetail user={user} />} /><Route path="/login" element={<Navigate to="/" replace />} /><Route path="/signup" element={<Navigate to="/" replace />} /><Route path="*" element={<><Heading eyebrow="LET’S GET YOU BACK" title="Page not found" /><Empty title="A little off the beaten path"><Link to="/">Back to the community</Link></Empty></>} /></Routes><div className="tl-mobile-account"><Link to={`/profile/${encodeURIComponent(user.username)}`}>@{user.username}</Link><button className="td-text-button" onClick={() => logout.mutate()} disabled={logout.isPending}><FiLogOut /> Sign out</button>{logout.isError && <p className="td-form-error" role="alert">{logout.error.message}</p>}</div><CreatorLinks className="td-mobile-credit" /></main><Discovery user={user} /></div><nav className="td-mobile-nav" aria-label="Mobile navigation">{nav.map(({ to, label, icon: Icon, badge, end }) => <NavLink key={label} to={to} end={end} className={({ isActive }) => isActive ? "is-active" : ""}><span><Icon />{badge > 0 && <i />}</span><small>{label === "Notifications" ? "Activity" : label === "Saved posts" ? "Saved" : label}</small></NavLink>)}</nav><button className="td-mobile-compose" aria-label="Create a post" onClick={() => setCompose(true)}><FiEdit3 /></button>{compose && <Modal title="Start a conversation" close={() => setCompose(false)}><Composer user={user} draft={draft} setDraft={setDraft} draftSaved={draftSaved} compact onDone={() => setCompose(false)} /></Modal>}{!draftSaved && <div className="td-storage-notice" role="status">Browser storage is unavailable. Keep this tab open to preserve your draft.</div>}</>;
}

export default function LiveApp() {
  const client = useQueryClient();
  const location = useLocation();
  const auth = useQuery({ queryKey: ["authUser"], queryFn: async ({ signal }) => { try { return await request("/auth/me", { signal }); } catch (error) { if (error.status === 401 || error.status === 404) return null; throw error; } }, retry: false, staleTime: 60000 });
  useEffect(() => {
    document.title = "Tweetie — A little more connected";
    async function expired() { await client.cancelQueries(); client.clear(); client.setQueryData(["authUser"], null); }
    window.addEventListener("tweetie:session-ended", expired);
    return () => window.removeEventListener("tweetie:session-ended", expired);
  }, [client]);
  const isSignup = location.pathname === "/signup";
  return <div className="tweetie-app tweetie-live"><a className="td-skip-link" href="#td-main">Skip to content</a>{auth.isPending || auth.isError ? <QueryState query={auth} /> : auth.data ? <Community key={auth.data._id} user={auth.data} /> : location.pathname === "/login" || isSignup ? <AuthPage key={location.pathname} signup={isSignup} /> : <Navigate to="/login" replace />}<Toaster position="bottom-center" toastOptions={{ style: { background: "#1c2943", color: "#edf0f8", border: "1px solid #405074" } }} /></div>;
}
