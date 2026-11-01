import DOMPurify from "dompurify";

function sanitizeHtml(html: string, sanitizeImport: boolean): string {
	const dirty = html;

	DOMPurify.setConfig({
		ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "strike", "s", "sub", "sup", "a", "p", "br", "pre", "code"],
		ALLOWED_ATTR: ['href'],
	});

	DOMPurify.addHook("beforeSanitizeElements", (node) => {
		if (node.nodeName == "P" && node instanceof HTMLElement) {
			node.replaceWith(...node.childNodes, document.createElement("br"));
		} else if (sanitizeImport && node.nodeName == "#text") {
			node.nodeValue = node.nodeValue?.replaceAll("\n", " ") ?? null;
		}
	});

	const clean = DOMPurify.sanitize(dirty);

	const formatted = clean
		.replaceAll("<br/>", "<br>")
		.replaceAll("<br />", "<br>")
		.split("<br>")
		.map(x => x.trim())
		.join("\n");
	return formatted;
}

export function sanitizeHtmlForImport(html: string): string {
	return sanitizeHtml(html, true);
}

export function sanitizeHtmlForRender(html: string): string {
	return sanitizeHtml(html, false);
}

export function textToHtml(input: string): string {
	const el = document.createElement("div");
	el.innerText = input;
	return el.innerHTML;
}

export function htmlToText(input: string): string {
	const el = document.createElement("div");
	el.innerHTML = sanitizeHtmlForRender(input);
	return el.innerText;
}


const MAX_SANITIZED_HTML_FOR_RENDER_CACHE_ENTRIES = 4096;
const sanitizedHtmlCacheForRender = new Map();
export function getCachedSanitizedHtmlForRender(dirty: string): string {
  const existingEntry = sanitizedHtmlCacheForRender.get(dirty);
  if (existingEntry != undefined) {
    return existingEntry;
  }

  if (sanitizedHtmlCacheForRender.size >= MAX_SANITIZED_HTML_FOR_RENDER_CACHE_ENTRIES) {
    sanitizedHtmlCacheForRender.clear();
  }
  
  const clean = sanitizeHtmlForRender(dirty);
  sanitizedHtmlCacheForRender.set(dirty, clean);
  return clean;
}
