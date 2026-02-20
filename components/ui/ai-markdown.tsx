"use client";

import React from "react";
import Link from "next/link";

interface AIMarkdownProps {
  content: string;
  className?: string;
}

export function AIMarkdown({ content, className = "" }: AIMarkdownProps) {
  const elements = parseMarkdown(content);

  return (
    <div className={`space-y-3 text-sm leading-relaxed ${className}`}>
      {elements}
    </div>
  );
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let orderedItems: React.ReactNode[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 ml-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  }

  function flushOrderedList() {
    if (orderedItems.length > 0) {
      elements.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 ml-1">
          {orderedItems}
        </ol>
      );
      orderedItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      flushList();
      flushOrderedList();
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      flushList();
      flushOrderedList();
      elements.push(
        <h3 key={key++} className="font-semibold text-base mt-4 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      flushOrderedList();
      elements.push(
        <h2 key={key++} className="font-semibold text-base mt-4 mb-1">
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      flushOrderedList();
      elements.push(
        <h1 key={key++} className="font-bold text-lg mt-4 mb-1">
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushList();
      flushOrderedList();
      elements.push(<hr key={key++} className="border-border my-3" />);
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line.trim())) {
      flushOrderedList();
      const content = line.trim().slice(2);
      listItems.push(<li key={key++}>{renderInline(content)}</li>);
      continue;
    }

    // Ordered list
    const orderedMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      flushList();
      orderedItems.push(<li key={key++}>{renderInline(orderedMatch[2])}</li>);
      continue;
    }

    // Paragraph
    flushList();
    flushOrderedList();
    elements.push(
      <p key={key++} className="text-foreground/90">
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  flushOrderedList();

  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Match: **bold**, `code`, and $TICKER patterns that link to /stocks/TICKER
  const regex = /(\*\*(.+?)\*\*)|(`([^`]+?)`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(linkifyTickers(text.slice(lastIndex, match.index), key++));
    }

    if (match[1]) {
      // Bold
      parts.push(
        <strong key={`b${key++}`} className="font-semibold text-foreground">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Code — check if it's a ticker-like pattern
      const code = match[4];
      if (/^[A-Z]{1,5}$/.test(code)) {
        parts.push(
          <Link
            key={`t${key++}`}
            href={`/stocks/${code}`}
            className="inline-flex items-center rounded bg-accent px-1.5 py-0.5 font-mono text-xs font-medium text-foreground hover:bg-accent/80 transition-colors"
          >
            {code}
          </Link>
        );
      } else {
        parts.push(
          <code
            key={`c${key++}`}
            className="rounded bg-accent px-1.5 py-0.5 font-mono text-xs"
          >
            {code}
          </code>
        );
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(linkifyTickers(text.slice(lastIndex), key++));
  }

  return parts.length === 1 ? parts[0] : parts;
}

function linkifyTickers(text: string, baseKey: number): React.ReactNode {
  // Don't linkify raw text tickers — only explicit `CODE` backtick references link
  return text;
}
