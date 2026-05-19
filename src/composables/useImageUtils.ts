export function getMime(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return map[ext] ?? "application/octet-stream";
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 65536; // 64KB – safe for large images
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

// Optional: Load a single image to data URL (used in HomeView for profiles)
export async function loadImageToDataUrl(
  bytes: Uint8Array,
  filename: string,
): Promise<string> {
  const base64 = uint8ArrayToBase64(bytes);
  return `data:${getMime(filename)};base64,${base64}`;
}
