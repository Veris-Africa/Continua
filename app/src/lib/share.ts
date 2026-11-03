export type ShareResult = { ok: boolean; method: "share" | "clipboard" | "cancelled" | "failed" };

/**
 * Shares a URL via the native share sheet when available, falling back to the
 * Clipboard API, and finally to a manual textarea + execCommand("copy") trick —
 * the Clipboard API silently fails in some mobile WebViews, and previously that
 * meant the share button did nothing at all with zero feedback to the user.
 */
export async function shareLink(url: string, opts?: { title?: string; text?: string }): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title: opts?.title, text: opts?.text, url });
      return { ok: true, method: "share" };
    } catch (err: any) {
      if (err?.name === "AbortError") return { ok: false, method: "cancelled" };
      // fall through to clipboard fallback below
    }
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return { ok: true, method: "clipboard" };
    }
    throw new Error("Clipboard API unavailable");
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (copied) return { ok: true, method: "clipboard" };
    } catch {
      // no-op — genuinely nothing worked
    }
  }

  return { ok: false, method: "failed" };
}

export type ImageShareResult = { ok: boolean; method: "share" | "clipboard" | "download" | "cancelled" | "failed" };

/**
 * Shares an image (e.g. a rendered portfolio card) via the native share
 * sheet when the platform supports sharing files, falling back to copying
 * the image to the clipboard, and finally to a plain download — so there's
 * always SOME way to get the image out of the browser, even on a desktop
 * browser with no share sheet and no image clipboard support.
 */
export async function shareImageBlob(blob: Blob, filename: string, opts?: { title?: string; text?: string }): Promise<ImageShareResult> {
  const file = new File([blob], filename, { type: blob.type || "image/png" });

  if (typeof navigator !== "undefined" && (navigator as any).canShare?.({ files: [file] })) {
    try {
      await (navigator as any).share({ title: opts?.title, text: opts?.text, files: [file] });
      return { ok: true, method: "share" };
    } catch (err: any) {
      if (err?.name === "AbortError") return { ok: false, method: "cancelled" };
      // fall through to the next option below
    }
  }

  try {
    if (navigator?.clipboard && (window as any).ClipboardItem) {
      await navigator.clipboard.write([new (window as any).ClipboardItem({ [blob.type || "image/png"]: blob })]);
      return { ok: true, method: "clipboard" };
    }
  } catch {
    // fall through to download below
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, method: "download" };
  } catch {
    return { ok: false, method: "failed" };
  }
}