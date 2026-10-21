import React from "react";

/**
 * Markdown mínimo para las respuestas de DiscBOT: párrafos, títulos (#),
 * listas (- * • y 1.), negrita, cursiva, código y enlaces http(s).
 * Genera elementos de React, nunca HTML: el texto del modelo no se inyecta.
 */

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(INLINE).map((piece, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!piece) return null;
    if ((piece.startsWith("**") && piece.endsWith("**")) || (piece.startsWith("__") && piece.endsWith("__"))) {
      return <strong key={key} className="tw-font-semibold tw-text-gray-900">{piece.slice(2, -2)}</strong>;
    }
    if (piece.startsWith("`") && piece.endsWith("`")) {
      return (
        <code key={key} className="tw-font-mono tw-text-[0.85em] tw-bg-gray-100 tw-rounded tw-px-1 tw-py-0.5">
          {piece.slice(1, -1)}
        </code>
      );
    }
    const link = piece.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      return (
        <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer" className="tw-text-brand-700 tw-underline hover:tw-text-brand-800">
          {link[1]}
        </a>
      );
    }
    if ((piece.startsWith("*") && piece.endsWith("*")) || (piece.startsWith("_") && piece.endsWith("_"))) {
      return <em key={key}>{piece.slice(1, -1)}</em>;
    }
    return <React.Fragment key={key}>{piece}</React.Fragment>;
  });
}

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "list"; ordered: boolean; start: number; items: { text: string; children: string[] }[] }
  | { kind: "paragraph"; lines: string[] };

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of markdown.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    const last = blocks[blocks.length - 1];
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    const indented = /^\s{2,}/.test(raw);

    if (!line.trim()) {
      blocks.push({ kind: "paragraph", lines: [] });
    } else if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2] });
    } else if ((bullet || numbered) && indented && last?.kind === "list") {
      // Sublista: va dentro del último elemento (p. ej. «* BPM: 118» bajo «1. Pista»)
      last.items[last.items.length - 1].children.push(bullet ? bullet[1] : numbered![2]);
    } else if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const text = bullet ? bullet[1] : numbered![2];
      if (last?.kind === "list" && last.ordered === ordered) last.items.push({ text, children: [] });
      else blocks.push({ kind: "list", ordered, start: numbered ? Number(numbered[1]) : 1, items: [{ text, children: [] }] });
    } else if (last?.kind === "paragraph") {
      last.lines.push(line);
    } else if (last?.kind === "list" && /^\s{2,}/.test(raw)) {
      // Continuación de un elemento de lista
      last.items[last.items.length - 1].text += ` ${line.trim()}`;
    } else {
      blocks.push({ kind: "paragraph", lines: [line] });
    }
  }
  return blocks.filter((b) => b.kind !== "paragraph" || b.lines.length > 0);
}

export default function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-text-[15px] tw-leading-relaxed tw-text-gray-800">
      {parseBlocks(text).map((block, i) => {
        if (block.kind === "heading") {
          return (
            <p key={i} className={`tw-font-bold tw-text-gray-900 ${block.level <= 2 ? "tw-text-base" : "tw-text-[15px]"}`}>
              {renderInline(block.text, `h${i}`)}
            </p>
          );
        }
        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={i}
              start={block.ordered && block.start !== 1 ? block.start : undefined}
              className={`tw-flex tw-flex-col tw-gap-1.5 tw-pl-5 ${block.ordered ? "tw-list-decimal" : "tw-list-disc"} marker:tw-text-gray-400`}
            >
              {block.items.map((item, j) => (
                <li key={j} className="tw-pl-1">
                  {renderInline(item.text, `l${i}-${j}`)}
                  {item.children.length > 0 && (
                    <ul className="tw-list-disc tw-pl-5 tw-mt-1 tw-flex tw-flex-col tw-gap-0.5 tw-text-gray-600 marker:tw-text-gray-300">
                      {item.children.map((child, k) => (
                        <li key={k}>{renderInline(child, `l${i}-${j}-${k}`)}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </List>
          );
        }
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(line, `p${i}-${j}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
