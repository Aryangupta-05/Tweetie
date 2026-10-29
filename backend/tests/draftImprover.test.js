import test from "node:test";
import assert from "node:assert/strict";
import { improveDraft } from "../lib/draftImprover.js";
import { searchFilter } from "../lib/searchFilter.js";

const result = (text, finishReason = "STOP") => ({ ok: true, json: async () => ({ candidates: [{ finishReason, content: { parts: [{ text }] } }] }) });
test("rejects empty and oversized drafts before calling the provider", async () => {
  for (const text of ["", "   ", null, {}, "a".repeat(501)]) await assert.rejects(improveDraft(text, { apiKey: "test", fetchImpl: () => { throw new Error("must not call"); } }), error => error.status === 400);
});
test("sends the key only in a header and returns the original draft for stale-preview protection", async () => {
  const text = "i build things";
  const data = await improveDraft(text, { apiKey: "private-test-key", fetchImpl: async (url, options) => {
    assert(!url.includes("private-test-key"));
    assert.equal(options.headers["x-goog-api-key"], "private-test-key");
    const body = JSON.parse(options.body);
    assert.equal(JSON.parse(body.contents[0].parts[0].text).draft, text);
    assert.equal(body.generationConfig.maxOutputTokens, 512);
    assert.deepEqual(body.generationConfig.thinkingConfig, { thinkingLevel: "MINIMAL" });
    assert.equal(body.generationConfig.responseSchema, undefined);
    return result("I build things.");
  } });
  assert.deepEqual(data, { original: text, suggestion: "I build things." });
});
test("returns the edited text without extra categories or commentary", async () => {
  const data = await improveDraft("i am doing work on making my app faster and it is slow now", { apiKey: "test", fetchImpl: async () => result("I'm working on speeding up my app.") });
  assert.deepEqual(Object.keys(data).sort(), ["original", "suggestion"]);
  assert.equal(data.suggestion, "I'm working on speeding up my app.");
});
test("edits around unfamiliar text without introducing a question or guessing its meaning", async () => {
  const text = "i am about to start unfwUIBAOUIBOA";
  const data = await improveDraft(text, { apiKey: "test", fetchImpl: async () => result("I am about to start unfwUIBAOUIBOA.") });
  assert.equal(data.suggestion, "I am about to start unfwUIBAOUIBOA.");
});
test("preserves an identical result so the frontend can show no changes", async () => {
  const data = await improveDraft("A clear update.", { apiKey: "test", fetchImpl: async () => result("A clear update.") });
  assert.equal(data.suggestion, data.original);
});
test("keeps provider errors and credentials out of client messages", async () => {
  for (const status of [400, 401, 403, 429, 500]) {
    await assert.rejects(improveDraft("hello", { apiKey: "secret", fetchImpl: async () => ({ ok: false, status, json: async () => ({ error: "secret provider detail" }) }) }), error => !error.message.includes("secret") && error.status === (status === 429 ? 429 : 503));
  }
});
test("rejects blocked, truncated, empty and oversized responses instead of silently replacing a draft", async () => {
  for (const [text, finish] of [["", "STOP"], ["partial", "MAX_TOKENS"], ["blocked", "SAFETY"], ["a".repeat(501), "STOP"]]) await assert.rejects(improveDraft("draft", { apiKey: "test", fetchImpl: async () => result(text, finish) }));
});
test("handles missing configuration and timeouts", async () => {
  await assert.rejects(improveDraft("draft", { apiKey: "" }), error => error.status === 503);
  await assert.rejects(improveDraft("draft", { apiKey: "test", fetchImpl: async () => { throw new DOMException("private", "TimeoutError"); } }), error => error.status === 503 && !error.message.includes("private"));
});
test("search treats regex metacharacters literally", () => {
  const filter = searchFilter("a.*(b)");
  assert(filter.post.test("a.*(b)"));
  assert(!filter.post.test("axyb"));
  assert.equal(searchFilter("x"), null);
  assert.equal(searchFilter({ $ne: "" }), null);
  assert.equal(searchFilter("x".repeat(81)), null);
});
test("hashtag search matches complete tags and punctuation, not longer tags", () => {
  const filter = searchFilter("#react");
  assert(filter.post.test("Learning #React!"));
  assert(filter.post.test("#react"));
  assert(filter.post.test("#react✨"));
  assert(filter.post.test("(#react) #react)"));
  assert(!filter.post.test("#reactnative"));
  assert(!filter.post.test("#reacté"));
  assert(!filter.post.test("word#react"));
});
