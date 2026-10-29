export async function request(path, { body, method = "GET", signal } = {}) {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const response = await fetch(`${base}/api${path}`, {
    method, signal, credentials: "include",
    ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || "Could not complete this request. Please try again.");
    error.status = response.status;
    if (response.status === 401 && path !== "/auth/me") window.dispatchEvent(new Event("tweetie:session-ended"));
    throw error;
  }
  if (data === null) throw new Error("The server returned an unexpected response. Please try again.");
  return data;
}
