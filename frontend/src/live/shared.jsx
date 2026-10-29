import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiFeather, FiRefreshCw, FiX } from "react-icons/fi";

export function Avatar({ person, size = "", linked = false }) {
  const initials = (person?.fullName || person?.username || "?").split(/\s+/).map(word => word[0]).slice(0, 2).join("").toUpperCase();
  const content = <span className={`td-avatar td-avatar-blue ${size}`} aria-hidden="true">{person?.profileImg ? <img src={person.profileImg} alt="" onError={event => { event.currentTarget.hidden = true; }} /> : null}<span>{initials}</span></span>;
  return linked && person?.username ? <Link to={`/profile/${encodeURIComponent(person.username)}`} aria-label={`View ${person.fullName || person.username}'s profile`}>{content}</Link> : content;
}
export function Brand() {
  return <Link to="/" className="td-brand" aria-label="Tweetie home"><span className="td-brand-mark"><FiFeather /></span>tweetie<span className="td-brand-dot">.</span></Link>;
}
export function Modal({ title, close, children }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="td-modal" aria-labelledby="live-modal-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}><div className="td-modal-header"><h2 id="live-modal-title">{title}</h2><button className="td-icon-button" onClick={close} aria-label="Close dialog"><FiX /></button></div>{children}</dialog>;
}
export function Heading({ eyebrow, title, action }) {
  return <header className="td-page-heading"><div><span className="td-eyebrow">{eyebrow}</span><h1>{title}</h1></div>{action || <span className="td-live-pill"><span /> COMMUNITY</span>}</header>;
}
export function Empty({ title, children }) {
  return <section className="td-empty"><span><FiFeather /></span><h2>{title}</h2><p>{children}</p></section>;
}
export function QueryState({ query, children, empty }) {
  if (query.isPending) return <div className="tl-status" role="status"><FiRefreshCw className="tl-spin" /> Loading…</div>;
  if (query.isError && !query.data) return <div className="tl-status" role="alert"><p>{query.error.message}</p><button className="td-button td-button-outline" onClick={() => query.refetch()}>Try again <FiRefreshCw /></button></div>;
  return <>{query.isError && <div className="tl-refresh-error" role="status">Could not refresh. Showing your last loaded content. <button onClick={() => query.refetch()}>Retry</button></div>}{query.isFetching && <div className="tl-refreshing" role="status">Refreshing…</div>}{empty || children}</>;
}
export function Showcase() {
  return <div className="td-showcase" aria-label="Tweetie project preview"><div className="td-showcase-grid" /><span className="td-showcase-kicker"><span /> A LITTLE MORE CONNECTED</span><div className="td-showcase-title">Good ideas.<br />Great conversations<span>.</span></div><div className="td-showcase-footer"><span><FiFeather /> tweetie</span><span>A space for what’s next <FiArrowUpRight /></span></div><div className="td-showcase-orbit orbit-one" /><div className="td-showcase-orbit orbit-two" /><div className="td-showcase-star">✳</div></div>;
}
