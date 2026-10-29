import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiCheck, FiHeart, FiUser } from "react-icons/fi";
import { Avatar, Empty, Heading, QueryState } from "./shared";
import { request } from "./api";
import { shortDate } from "./utils";
import { useAction } from "./hooks";

export default function NotificationsPage({ user }) {
  const query = useQuery({ queryKey: ["notifications", user._id], queryFn: ({ signal }) => request("/notifications", { signal }), refetchInterval: 60000 });
  const mark = useAction(() => request("/notifications/read", { method: "PATCH" }));
  const unread = query.data?.filter(item => !item.read).length || 0;
  return <><Heading eyebrow="YOU’RE PART OF THE CONVERSATION" title="Notifications" action={<button className="td-text-button" disabled={!unread || mark.isPending} onClick={() => mark.mutate()}><FiCheck />{mark.isPending ? "Updating…" : "Mark all read"}</button>} /><div className="td-section-label">Recent activity <span>{unread} unread</span></div><QueryState query={query}>{query.data?.length ? query.data.map(item => <div className={`td-notification ${!item.read ? "is-unread" : ""}`} key={item._id}><div className={`td-notification-icon ${item.type}`}>{item.type === "like" ? <FiHeart /> : <FiUser />}</div><div><Avatar person={item.from} linked /><p>{item.from?.username ? <Link className="td-name" to={`/profile/${encodeURIComponent(item.from.username)}`}>{item.from.fullName || item.from.username}</Link> : "Former member"} {item.type === "like" ? "liked your post." : "started following you."}</p><span className="td-subtle">{shortDate(item.createdAt)}</span></div>{!item.read && <span className="td-unread-dot" aria-label="Unread" />}</div>) : <Empty title="You’re all caught up">Likes and new followers will appear here.</Empty>}</QueryState></>;
}
