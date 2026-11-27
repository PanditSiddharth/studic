export type SeoAuditIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type SeoPageSnapshot = {
  url: string;
  status: number;
  redirected: boolean;
  title: string;
  description: string;
  canonical: string;
  h1Count: number;
  missingImageAltCount: number;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImage: string;
  robots: string;
  structuredDataCount: number;
  invalidStructuredDataCount: number;
  brokenInternalLinks: Array<{ url: string; status: number | null }>;
};

export function auditSeoPage(page: SeoPageSnapshot): SeoAuditIssue[] {
  const issues: SeoAuditIssue[] = [];
  const add = (code: string, message: string, severity: SeoAuditIssue["severity"] = "warning") =>
    issues.push({ code, message, severity });

  if (page.status < 200 || page.status >= 400) add("http-status", `Page responded with HTTP ${page.status}.`, "error");
  if (page.redirected) add("sitemap-redirect", "Sitemap URL redirects instead of resolving directly.", "error");
  if (!page.title.trim()) add("missing-title", "Missing document title.", "error");
  if (!page.description.trim()) add("missing-description", "Missing meta description.", "error");
  if (!page.canonical.trim()) add("missing-canonical", "Missing canonical URL.", "error");
  else {
    try {
      const canonical = new URL(page.canonical);
      if (canonical.origin !== new URL(page.url).origin || canonical.search || canonical.hash) {
        add("invalid-canonical", "Canonical URL uses another origin or contains query/hash data.", "error");
      }
    } catch {
      add("invalid-canonical", "Canonical URL is not an absolute HTTP URL.", "error");
    }
  }
  if (!page.h1Count) add("missing-h1", "No H1 heading found.", "error");
  if (page.h1Count > 1) add("multiple-h1", `Found ${page.h1Count} H1 headings.`);
  if (page.missingImageAltCount) {
    add("missing-image-alt", `${page.missingImageAltCount} image(s) are missing an alt attribute.`);
  }
  if (!page.openGraphTitle.trim()) add("missing-og-title", "Missing Open Graph title.");
  if (!page.openGraphDescription.trim()) add("missing-og-description", "Missing Open Graph description.");
  if (!page.openGraphImage.trim()) add("missing-og-image", "Missing Open Graph image.");
  if (/\b(noindex|nofollow)\b/i.test(page.robots)) {
    add("robots-directive", `Unexpected robots directive: ${page.robots}.`, "error");
  }
  if (!page.structuredDataCount) add("missing-structured-data", "No JSON-LD structured data found.");
  if (page.invalidStructuredDataCount) {
    add("invalid-structured-data", `${page.invalidStructuredDataCount} JSON-LD block(s) contain invalid JSON.`, "error");
  }
  for (const link of page.brokenInternalLinks) {
    add("broken-internal-link", `Internal link ${link.url} returned ${link.status ?? "a network error"}.`, "error");
  }
  return issues;
}

export function addDuplicateSeoIssues(pages: Array<{ url: string; title: string; description: string; issues: SeoAuditIssue[] }>) {
  const addDuplicates = (field: "title" | "description", code: string, label: string) => {
    const groups = new Map<string, typeof pages>();
    for (const page of pages) {
      const value = page[field].trim().toLowerCase();
      if (!value) continue;
      groups.set(value, [...(groups.get(value) || []), page]);
    }
    for (const duplicates of groups.values()) {
      if (duplicates.length < 2) continue;
      for (const page of duplicates) {
        page.issues.push({
          code,
          message: `Duplicate ${label} shared by ${duplicates.length} pages.`,
          severity: "warning",
        });
      }
    }
  };

  addDuplicates("title", "duplicate-title", "title");
  addDuplicates("description", "duplicate-description", "description");
}
