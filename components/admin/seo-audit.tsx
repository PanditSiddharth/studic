"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Play, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auditSeoPage, addDuplicateSeoIssues, type SeoAuditIssue, type SeoPageSnapshot } from "@/lib/seo-audit";

type AuditRow = {
  url: string;
  title: string;
  description: string;
  issues: SeoAuditIssue[];
};

type ParsedPage = SeoPageSnapshot & { links: string[] };

const CRAWL_LIMIT = 200;
const LINK_CHECK_LIMIT = 100;
const CONCURRENCY = 5;

async function forEachLimit<T>(items: T[], limit: number, run: (item: T) => Promise<void>) {
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      await run(items[index]);
    }
  }));
}

function metaContent(document: Document, selector: string) {
  return document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || "";
}

function inspectHtml(url: string, status: number, redirected: boolean, html: string, robotsHeader: string): ParsedPage {
  const document = new DOMParser().parseFromString(html, "text/html");
  const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  let invalidStructuredDataCount = 0;
  for (const script of structuredData) {
    try {
      JSON.parse(script.textContent || "");
    } catch {
      invalidStructuredDataCount += 1;
    }
  }

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .map((anchor) => anchor.href)
    .filter(Boolean);

  return {
    url,
    status,
    redirected,
    title: document.title.trim(),
    description: metaContent(document, 'meta[name="description"]'),
    canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || "",
    h1Count: document.querySelectorAll("h1").length,
    missingImageAltCount: document.querySelectorAll("img:not([alt])").length,
    openGraphTitle: metaContent(document, 'meta[property="og:title"]'),
    openGraphDescription: metaContent(document, 'meta[property="og:description"]'),
    openGraphImage: metaContent(document, 'meta[property="og:image"]'),
    robots: metaContent(document, 'meta[name="robots"]') || robotsHeader,
    structuredDataCount: structuredData.length,
    invalidStructuredDataCount,
    brokenInternalLinks: [],
    links,
  };
}

export default function SeoAuditDashboard() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [checkedLinks, setCheckedLinks] = useState(0);

  const runAudit = async () => {
    setRunning(true);
    setError("");
    setRows([]);
    setCheckedLinks(0);
    try {
      const sitemapResponse = await fetch("/sitemap.xml", { cache: "no-store" });
      if (!sitemapResponse.ok) throw new Error(`Sitemap request failed with HTTP ${sitemapResponse.status}.`);
      const xml = new DOMParser().parseFromString(await sitemapResponse.text(), "application/xml");
      if (xml.querySelector("parsererror")) throw new Error("The sitemap response is not valid XML.");

      const locs = Array.from(xml.querySelectorAll("url > loc"))
        .map((node) => node.textContent?.trim() || "")
        .filter(Boolean);
      if (!locs.length) throw new Error("The sitemap contains no URLs to audit.");

      const currentOrigin = window.location.origin;
      const sitemapPaths = locs.map((value) => {
        const parsed = new URL(value);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(`Invalid sitemap URL: ${value}`);
        if (parsed.search || parsed.hash) throw new Error(`Sitemap URL must not contain a query or fragment: ${value}`);
        return parsed.pathname;
      });
      const paths = [...new Set(sitemapPaths)];
      if (paths.length !== sitemapPaths.length) throw new Error("The sitemap contains duplicate URLs.");
      setTruncated(paths.length > CRAWL_LIMIT);
      const targetPaths = paths.slice(0, CRAWL_LIMIT);
      const pages: ParsedPage[] = [];

      await forEachLimit(targetPaths, CONCURRENCY, async (path) => {
        try {
          const response = await fetch(new URL(path, currentOrigin), { cache: "no-store", redirect: "follow" });
          const html = await response.text();
          pages.push(inspectHtml(
            new URL(path, currentOrigin).toString(),
            response.status,
            response.redirected,
            html,
            response.headers.get("x-robots-tag") || ""
          ));
        } catch {
          pages.push({
            url: new URL(path, currentOrigin).toString(),
            status: 0,
            redirected: false,
            title: "",
            description: "",
            canonical: "",
            h1Count: 0,
            missingImageAltCount: 0,
            openGraphTitle: "",
            openGraphDescription: "",
            openGraphImage: "",
            robots: "",
            structuredDataCount: 0,
            invalidStructuredDataCount: 0,
            brokenInternalLinks: [],
            links: [],
          });
        }
      });

      const sourcesByLink = new Map<string, Set<string>>();
      for (const page of pages) {
        for (const href of page.links) {
          try {
            const target = new URL(href);
            if (
              target.origin !== currentOrigin ||
              target.hash ||
              ["/admin", "/api", "/auth", "/login", "/profile", "/chat", "/payment", "/terminal"].some(
                (prefix) => target.pathname === prefix || target.pathname.startsWith(`${prefix}/`)
              )
            ) continue;
            target.hash = "";
            target.search = "";
            const normalized = target.toString();
            if (!sourcesByLink.has(normalized)) sourcesByLink.set(normalized, new Set());
            sourcesByLink.get(normalized)?.add(page.url);
          } catch {
            continue;
          }
        }
      }

      const linksToCheck = Array.from(sourcesByLink.keys()).slice(0, LINK_CHECK_LIMIT);
      const brokenBySource = new Map<string, Array<{ url: string; status: number | null }>>();
      await forEachLimit(linksToCheck, CONCURRENCY, async (url) => {
        try {
          const response = await fetch(url, { method: "HEAD", cache: "no-store", redirect: "follow" });
          if (response.status < 400 || response.status === 405) return;
          for (const source of sourcesByLink.get(url) || []) {
            if (!brokenBySource.has(source)) brokenBySource.set(source, []);
            brokenBySource.get(source)?.push({ url, status: response.status });
          }
        } catch {
          for (const source of sourcesByLink.get(url) || []) {
            if (!brokenBySource.has(source)) brokenBySource.set(source, []);
            brokenBySource.get(source)?.push({ url, status: null });
          }
        }
      });
      setCheckedLinks(linksToCheck.length);

      const audited = pages.map((page) => {
        page.brokenInternalLinks = brokenBySource.get(page.url) || [];
        return {
          url: page.url,
          title: page.title,
          description: page.description,
          issues: auditSeoPage(page),
        };
      });
      addDuplicateSeoIssues(audited);
      setRows(audited.sort((a, b) => b.issues.length - a.issues.length || a.url.localeCompare(b.url)));
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : "The SEO audit could not be completed.");
    } finally {
      setRunning(false);
    }
  };

  const issueCount = rows.reduce((count, row) => count + row.issues.length, 0);

  return (
    <main className="space-y-6 p-4 sm:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Technical SEO</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">SEO audit</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Crawl the current XML sitemap and inspect rendered metadata, headings, images, structured data and internal links.
          </p>
        </div>
        <Button onClick={runAudit} disabled={running} className="gap-2">
          {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {running ? "Auditing sitemap…" : "Run audit"}
        </Button>
      </header>

      {error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p> : null}
      {truncated ? <p className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">Audit capped at {CRAWL_LIMIT} sitemap URLs. Narrow the sitemap or run another crawl to inspect the remainder.</p> : null}

      {rows.length ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4"><p className="text-2xl font-semibold">{rows.length}</p><p className="text-xs text-muted-foreground">Pages checked</p></div>
            <div className="rounded-xl border bg-card p-4"><p className="text-2xl font-semibold">{issueCount}</p><p className="text-xs text-muted-foreground">Detected issues</p></div>
            <div className="rounded-xl border bg-card p-4"><p className="text-2xl font-semibold">{checkedLinks}</p><p className="text-xs text-muted-foreground">Unique internal links checked (limit {LINK_CHECK_LIMIT})</p></div>
          </section>
          <div className="space-y-3">
            {rows.map((row) => (
              <article key={row.url} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <a href={row.url} target="_blank" rel="noreferrer" className="break-all text-sm font-medium text-primary hover:underline">{new URL(row.url).pathname}</a>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{row.title || "No title"}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${row.issues.length ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
                    {row.issues.length ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                    {row.issues.length ? `${row.issues.length} issue(s)` : "No issues found"}
                  </span>
                </div>
                {row.issues.length ? (
                  <ul className="mt-3 space-y-1.5 border-t pt-3">
                    {row.issues.map((issue, index) => (
                      <li key={`${issue.code}-${index}`} className={`flex gap-2 text-xs ${issue.severity === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                        <SearchCheck size={14} className="mt-0.5 shrink-0" />
                        <span>{issue.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <SearchCheck size={24} className="mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">{running ? "Inspecting live page HTML…" : "Run an audit to inspect sitemap pages."}</p>
          <p className="mt-1 text-xs text-muted-foreground">This only reads public pages; it does not change content or indexing settings.</p>
        </div>
      )}
    </main>
  );
}
