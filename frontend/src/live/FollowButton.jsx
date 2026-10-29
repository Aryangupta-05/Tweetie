import { FiCheck, FiPlus } from "react-icons/fi";
import { request } from "./api";
import { containsId } from "./utils";
import { useAction } from "./hooks";

export default function FollowButton({ person, user, full = false }) {
  const following = containsId(user.following, person._id);
  const mutation = useAction(() => request(`/users/follow/${person._id}`, { method: "POST" }));
  if (person._id === user._id) return null;
  return <button className={full ? `td-button ${following ? "td-button-outline" : "td-button-primary"}` : `td-follow-button ${following ? "is-following" : ""}`} aria-label={`${following ? "Unfollow" : "Follow"} ${person.fullName || person.username}`} aria-pressed={following} disabled={mutation.isPending} onClick={() => mutation.mutate()}>{following ? <FiCheck /> : <FiPlus />}{full && (mutation.isPending ? "Updating…" : following ? "Following" : "Follow")}</button>;
}
