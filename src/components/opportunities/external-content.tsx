"use client";

import { useState, useCallback, type ReactNode } from "react";

const AUTH_REQUIRED_DOMAINS: Record<string, { name: string; description: string }> = {
  "piee.eb.mil": {
    name: "PIEE (Procurement Integrated Enterprise Environment)",
    description: "DoD 계정 로그인이 필요합니다.",
  },
  "dibbs.bsm.dla.mil": {
    name: "DLA Internet Bid Board System (DIBBS)",
    description: "DLA 계정 로그인이 필요합니다.",
  },
  "wawf.eb.mil": {
    name: "Wide Area Workflow (WAWF)",
    description: "DoD 계정 로그인이 필요합니다.",
  },
};

const URL_REGEX = /https?:\/\/[^\s)<>]+/g;
// solicitation number: 영문+숫자 혼합, 최소 하나의 숫자 포함, 8자 이상
const SOLICITATION_REGEX = /\b([A-Z][A-Z0-9]{7,}(?:-[A-Z0-9]+)*)\b/g;

function detectAuthDomains(text: string): { domain: string; info: typeof AUTH_REQUIRED_DOMAINS[string]; url: string }[] {
  const found: { domain: string; info: typeof AUTH_REQUIRED_DOMAINS[string]; url: string }[] = [];
  const urls = text.match(URL_REGEX) || [];
  for (const url of urls) {
    try {
      const hostname = new URL(url).hostname;
      for (const [domain, info] of Object.entries(AUTH_REQUIRED_DOMAINS)) {
        if (hostname.includes(domain) && !found.some((f) => f.domain === domain)) {
          found.push({ domain, info, url });
        }
      }
    } catch { /* invalid URL */ }
  }
  return found;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
      title="복사"
    >
      {copied ? "✓" : "복사"}
    </button>
  );
}

function parseDescription(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  const combined = new RegExp(`(${URL_REGEX.source})|(${SOLICITATION_REGEX.source})`, "g");
  let match: RegExpExecArray | null;

  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(
        <a
          key={`url-${match.index}`}
          href={match[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {match[1]}
        </a>
      );
    } else if (match[2] && /\d/.test(match[2])) {
      parts.push(
        <span key={`sol-${match.index}`} className="inline-flex items-center">
          <span className="font-semibold font-mono text-foreground">{match[2]}</span>
          <CopyButton text={match[2]} />
        </span>
      );
    } else if (match[2]) {
      parts.push(match[2]);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function ExternalContent({ description }: { description: string }) {
  const authDomains = detectAuthDomains(description);
  const parsedContent = parseDescription(description);

  return (
    <div className="space-y-4">
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {parsedContent}
      </div>

      {authDomains.map(({ domain, info, url }) => (
        <div
          key={domain}
          className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-amber-500">⚠</span>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-amber-200">
                이 문서는 {info.name}에서 확인할 수 있습니다.
              </p>
              <p className="text-xs text-muted-foreground">{info.description}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  {domain} 바로가기 →
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
