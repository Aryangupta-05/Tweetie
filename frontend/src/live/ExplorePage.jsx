import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiArrowRight, FiSearch } from "react-icons/fi";
import { Avatar, Empty, Heading, QueryState } from "./shared";
import { request } from "./api";
import FollowButton from "./FollowButton";
import PostCard from "./PostCard";

export default function ExplorePage({ user }) {
  const [params, setParams] = useSearchParams();
  const text = params.get("q")?.trim() || "";
  const valid = text.length >= 2 && text.length <= 80;
  const query = useQuery({ queryKey: ["search", user._id, text], queryFn: ({ signal }) => request(`/search?q=${encodeURIComponent(text)}`, { signal }), enabled: valid });
  const suggestions = useQuery({ queryKey: ["suggested", user._id], queryFn: ({ signal }) => request("/users/suggested", { signal }), enabled: !text });
  const people = text ? query.data?.users : suggestions.data;
  return <><Heading eyebrow="FOLLOW YOUR CURIOSITY" title="Explore" /><div className="td-explore-search"><form className="td-search" key={text} onSubmit={event => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get("search") || "").trim(); setParams(value ? { q: value } : {}); }}><FiSearch /><input name="search" aria-label="Search people and posts" defaultValue={text} maxLength={80} placeholder="Search people, ideas, and conversations" /><button type="submit" aria-label="Search"><FiArrowRight /></button></form><div className="td-topic-chips">{["buildinpublic", "design", "opensource", "backend"].map(tag => <Link key={tag} className={text === `#${tag}` ? "is-active" : ""} to={`/explore?q=${encodeURIComponent(`#${tag}`)}`}>#{tag}</Link>)}</div></div>{text && !valid ? <Empty title="A little more to search">Enter 2 to 80 characters to search people or posts.</Empty> : <QueryState query={text ? query : suggestions}>{people?.length > 0 && <section className="td-explore-people"><span className="td-eyebrow">{text ? "PEOPLE" : "PEOPLE TO KNOW"}</span>{people.map(person => <div className="td-person-row" key={person._id}><Avatar person={person} linked /><Link className="td-person-info" to={`/profile/${encodeURIComponent(person.username)}`}><strong>{person.fullName}</strong><span>@{person.username}</span></Link><FollowButton person={person} user={user} /></div>)}</section>}{text ? <><div className="td-section-label">Posts matching “{text}”<span>{query.data?.posts?.length || 0}</span></div>{query.data?.posts?.length ? query.data.posts.map(post => <PostCard key={post._id} post={post} user={user} />) : <Empty title="No matching posts">Try another name, phrase or hashtag.</Empty>}<p className="tl-result-note">Showing up to 20 people and 20 posts. Refine your search to find more.</p></> : <Empty title="Follow your curiosity">Search for a person, a phrase, or a hashtag to find your next conversation.</Empty>}</QueryState>}</>;
}
