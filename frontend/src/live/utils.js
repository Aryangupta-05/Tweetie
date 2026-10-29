export const idOf = value => String(value?._id || value || "");
export const containsId = (values, id) => values?.some(value => idOf(value) === idOf(id)) || false;
export function safeLink(value) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function shortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  return minutes < 1 ? "now" : minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${Math.floor(minutes / 60)}h` : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
export function readImage(file, maxMb = 4) {
  return new Promise((resolve, reject) => {
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) return reject(new Error("Choose a PNG, JPEG, WebP or GIF image."));
    if (file.size > maxMb * 1024 * 1024) return reject(new Error(`Choose an image up to ${maxMb} MB.`));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the image. Try another file."));
    reader.readAsDataURL(file);
  });
}
