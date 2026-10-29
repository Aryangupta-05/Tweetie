import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiArrowUpRight, FiCheck, FiCompass, FiImage, FiLoader, FiRefreshCw, FiSmile, FiX, FiZap } from "react-icons/fi";
import { Avatar } from "./shared";
import { request } from "./api";
import { readImage } from "./utils";
import { useAction } from "./hooks";

const emojis = ["😊", "✨", "🎉", "🚀", "❤️", "👏", "🔥", "💡", "🙌", "👍", "🌱", "💻", "😂", "🤔", "👀", "✅", "💪", "🙏", "🎯", "☕"];
export default function Composer({ user, draft, setDraft, draftSaved = true, compact = false, onDone }) {
  const [image, setImage] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [assistant, setAssistant] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef(null);
  const textRef = useRef(null);
  const emojiRef = useRef(null);
  const emojiButton = useRef(null);
  const aiController = useRef(null);
  const recentSuggestion = useRef(null);
  const ai = useMutation({ mutationFn: async ({ text, signal, fresh }) => {
    const cached = recentSuggestion.current;
    if (!fresh && cached?.result.original === text && Date.now() - cached.createdAt < 300000) return cached.result;
    const result = await request("/ai/improve", { method: "POST", body: { text }, signal });
    recentSuggestion.current = { result, createdAt: Date.now() };
    return result;
  }, retry: false });
  const create = useAction(payload => request("/posts/create", { method: "POST", body: payload }), () => { setDraft(""); setImage(""); closeAssistant(); toast.success("Post shared"); onDone?.(); });
  useEffect(() => () => aiController.current?.abort(), []);
  function closeAssistant() {
    aiController.current?.abort();
    ai.reset();
    setAssistant(false);
  }
  function improve(fresh = false) {
    if (!draft.trim() || draft.length > 500 || ai.isPending || create.isPending) return;
    aiController.current?.abort();
    aiController.current = new AbortController();
    ai.reset();
    setAssistant(true);
    ai.mutate({ text: draft, signal: aiController.current.signal, fresh });
  }
  useEffect(() => {
    const element = textRef.current;
    if (element) { element.style.height = "auto"; element.style.height = `${Math.min(element.scrollHeight, 220)}px`; }
  }, [draft]);
  useEffect(() => {
    if (!emojiOpen) return;
    function outside(event) { if (!emojiRef.current?.contains(event.target)) setEmojiOpen(false); }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [emojiOpen]);
  async function upload(event) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    setReading(true); setError("");
    try { setImage(await readImage(file)); } catch (problem) { setError(problem.message); } finally { setReading(false); }
  }
  function insertEmoji(emoji) {
    const element = textRef.current;
    const start = element.selectionStart ?? draft.length;
    const end = element.selectionEnd ?? start;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    if (next.length <= 500) {
      setDraft(next);
      requestAnimationFrame(() => { element.focus(); element.setSelectionRange(start + emoji.length, start + emoji.length); });
    }
    setEmojiOpen(false);
  }
  const unchanged = ai.data?.original === draft;
  const canApply = ai.data && ai.data.suggestion !== ai.data.original.trim();
  return <form className={`td-composer ${compact ? "td-composer-modal" : ""}`} onSubmit={event => { event.preventDefault(); if ((!draft.trim() && !image) || draft.length > 500 || reading || create.isPending) return; create.mutate({ text: draft.trim(), ...(image ? { img: image } : {}) }); }}>
    <div className="td-compose-main"><Avatar person={user} /><div className="td-compose-content"><label className="td-sr-only" htmlFor={compact ? "live-modal-draft" : "live-feed-draft"}>Write a post</label><textarea ref={textRef} id={compact ? "live-modal-draft" : "live-feed-draft"} placeholder="What have you been working on?" value={draft} onChange={event => setDraft(event.target.value)} maxLength={501} rows={compact ? 4 : 2} disabled={create.isPending} /><div className="td-compose-audience"><FiCompass /> Everyone can join the conversation</div>{image && <div className="td-image-preview"><img src={image} alt="Your attachment preview" /><button className="td-icon-button" type="button" aria-label="Remove attachment" disabled={create.isPending} onClick={() => setImage("")}><FiX /></button></div>}{error && <p className="td-form-error" role="alert">{error}</p>}{reading && <p className="td-subtle" role="status">Preparing your image…</p>}{create.isError && <p className="td-form-error" role="alert">{create.error.message} Your draft is preserved.</p>}</div></div>
    {assistant && <section className="tl-writing-assistant" aria-label="Writing assistant" aria-busy={ai.isPending}>
      <div className="tl-writing-header"><span className="tl-writing-title" role={ai.isPending ? "status" : undefined}>{ai.isPending ? <FiLoader className="tl-spin" /> : <FiZap />}{ai.isPending ? "Polishing your draft…" : ai.isError ? "Let’s try that again" : canApply ? "Suggested edit" : "No changes suggested"}</span><button type="button" className="td-icon-button" aria-label={ai.isPending ? "Cancel rewrite" : "Dismiss suggestion"} onClick={closeAssistant}><FiX /></button></div>
      {ai.isError && <p className="tl-writing-error" role="alert">{ai.error.message}</p>}
      {ai.data && <>{canApply ? <blockquote>{ai.data.suggestion}</blockquote> : <p className="tl-writing-note" role="status">Your draft is unchanged.</p>}{!unchanged && <p className="tl-writing-note">Draft changed. Try again for a fresh suggestion.</p>}<div className="tl-writing-actions">{canApply && <button type="button" className="td-button td-button-primary" disabled={!unchanged || create.isPending} onClick={() => { setDraft(ai.data.suggestion); closeAssistant(); textRef.current?.focus(); }}><FiCheck /> Use suggestion</button>}<button type="button" className="td-text-button" onClick={() => { closeAssistant(); textRef.current?.focus(); }}>{canApply ? "Keep original" : "Done"}</button><button type="button" className="td-icon-button tl-writing-retry" aria-label="Try another suggestion" title="Try another suggestion" disabled={!draft.trim() || draft.length > 500 || create.isPending} onClick={() => improve(true)}><FiRefreshCw /></button></div></>}
      {ai.isError && <button type="button" className="td-text-button" disabled={!draft.trim() || draft.length > 500 || create.isPending} onClick={() => improve(true)}><FiRefreshCw /> Try again</button>}
      <details className="tl-ai-details"><summary>About AI</summary><p>Your draft is sent to Google Gemini. On the free tier, Google may use it to improve its products. Suggestions are optional and never post automatically.</p></details>
    </section>}
    <div className="td-compose-toolbar"><div className="td-compose-tools"><input ref={inputRef} className="td-sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" tabIndex={-1} onChange={upload} /><button type="button" className="td-icon-button" aria-label="Attach image" title="Attach image up to 4 MB" disabled={reading || create.isPending} onClick={() => inputRef.current?.click()}><FiImage /></button><div className="tl-emoji-wrap" ref={emojiRef} onKeyDown={event => { if (event.key === "Escape" && emojiOpen) { event.preventDefault(); event.stopPropagation(); setEmojiOpen(false); emojiButton.current?.focus(); } }}><button ref={emojiButton} type="button" className="td-icon-button" aria-label="Choose an emoji" aria-expanded={emojiOpen} disabled={create.isPending} onClick={() => setEmojiOpen(!emojiOpen)}><FiSmile /></button>{emojiOpen && <div className="tl-emoji-picker" role="group" aria-label="Emoji picker">{emojis.map(emoji => <button type="button" key={emoji} aria-label={`Insert ${emoji} emoji`} onClick={() => insertEmoji(emoji)}>{emoji}</button>)}</div>}</div><span className="td-toolbar-divider" /><button type="button" className={`td-ai-button ${assistant ? "is-active" : ""}`} aria-label="Improve with AI" title="Polish your draft with Google Gemini" aria-expanded={assistant} disabled={create.isPending || ai.isPending || !draft.trim() || draft.length > 500} onClick={() => improve()}><FiZap /><span>Improve with AI</span></button></div><div className="td-compose-submit"><span className={`td-character-count ${draft.length > 500 ? "is-over" : ""}`}>{draft ? `${draft.length}/500` : ""}</span><button className="td-button td-button-primary" disabled={(!draft.trim() && !image) || draft.length > 500 || reading || create.isPending}>{create.isPending ? "Posting…" : "Post"}<FiArrowUpRight /></button></div></div>{draft && <div className="td-draft-status"><FiCheck />{draftSaved ? "Draft saved on this device" : "Draft kept in this tab"}</div>}
  </form>;
}
