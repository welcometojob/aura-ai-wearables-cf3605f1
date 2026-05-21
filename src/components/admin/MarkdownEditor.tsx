import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Eye,
  Pencil,
  Minus,
  Columns,
} from "lucide-react";
import { markdownComponents } from "@/lib/markdown-components";

type Mode = "edit" | "preview" | "split";

type Props = {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
};

export function MarkdownEditor({ value, onChange, rows = 22 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<Mode>("split");

  const wrap = (before: string, after = before, placeholder = "") => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = start + before.length + selected.length;
      ta.setSelectionRange(cursor, cursor);
    });
  };

  const prefixLines = (token: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = end === start ? value.indexOf("\n", end) : end;
    const safeLineEnd = lineEnd === -1 ? value.length : lineEnd;
    const before = value.slice(0, lineStart);
    const block = value.slice(lineStart, safeLineEnd) || "Heading";
    const after = value.slice(safeLineEnd);
    const prefixed = block
      .split("\n")
      .map((l) => (l.startsWith(token) ? l : `${token}${l}`))
      .join("\n");
    onChange(before + prefixed + after);
    requestAnimationFrame(() => ta.focus());
  };

  const insertBlock = (text: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const needsLeadingNewline = start > 0 && value[start - 1] !== "\n";
    const insert = `${needsLeadingNewline ? "\n" : ""}${text}\n`;
    onChange(value.slice(0, start) + insert + value.slice(start));
    requestAnimationFrame(() => ta.focus());
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL (https://…)");
    if (!url) return;
    wrap("[", `](${url})`, "link text");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/30 p-2">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton icon={Heading1} label="Heading 1" onClick={() => prefixLines("# ")} />
          <ToolbarButton icon={Heading2} label="Heading 2" onClick={() => prefixLines("## ")} />
          <ToolbarButton icon={Heading3} label="Heading 3" onClick={() => prefixLines("### ")} />
          <Divider />
          <ToolbarButton icon={Bold} label="Bold" onClick={() => wrap("**", "**", "bold text")} />
          <ToolbarButton icon={Italic} label="Italic" onClick={() => wrap("_", "_", "italic text")} />
          <Divider />
          <ToolbarButton icon={List} label="Bullet list" onClick={() => prefixLines("- ")} />
          <ToolbarButton icon={ListOrdered} label="Numbered list" onClick={() => prefixLines("1. ")} />
          <ToolbarButton icon={Quote} label="Quote" onClick={() => prefixLines("> ")} />
          <ToolbarButton icon={LinkIcon} label="Insert link" onClick={insertLink} />
          <ToolbarButton icon={Minus} label="Divider" onClick={() => insertBlock("---")} />
        </div>
        <div className="inline-flex rounded-lg border border-border bg-background/40 p-1 text-[11px]">
          <ModeButton active={mode === "edit"} onClick={() => setMode("edit")} icon={Pencil} label="Edit" />
          <ModeButton active={mode === "split"} onClick={() => setMode("split")} icon={Columns} label="Split" />
          <ModeButton active={mode === "preview"} onClick={() => setMode("preview")} icon={Eye} label="Preview" />
        </div>
      </div>

      <div className={`grid gap-3 ${mode === "split" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {(mode === "edit" || mode === "split") && (
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={"# Page heading\n\nWrite a paragraph. Leave a blank line for a new paragraph.\n\n## Section heading\n\n- Bullet point one\n- Bullet point two\n\n**Bold text** and _italic text_."}
            rows={rows}
            className="w-full resize-y rounded-lg border border-border bg-background/40 p-3 font-mono text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <div className="min-h-[400px] overflow-auto rounded-lg border border-border bg-background/40 p-5">
            {value.trim() ? (
              <ReactMarkdown components={markdownComponents}>{value}</ReactMarkdown>
            ) : (
              <p className="text-sm text-muted-foreground">Preview will appear here…</p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-background/20 p-3 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">Quick syntax:</span>{" "}
        <code className="mx-0.5 rounded bg-muted px-1.5 py-0.5"># Heading</code>
        <code className="mx-0.5 rounded bg-muted px-1.5 py-0.5">**bold**</code>
        <code className="mx-0.5 rounded bg-muted px-1.5 py-0.5">_italic_</code>
        <code className="mx-0.5 rounded bg-muted px-1.5 py-0.5">- list item</code>
        <code className="mx-0.5 rounded bg-muted px-1.5 py-0.5">[text](https://url)</code>
        <span className="ml-2">— blank line = new paragraph</span>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background/40 text-muted-foreground transition hover:border-primary hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded px-2.5 py-1 transition ${
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}
