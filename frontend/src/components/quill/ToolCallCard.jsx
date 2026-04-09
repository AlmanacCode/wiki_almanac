import { useState } from "react";

const TOOL_LABELS = {
  read_article: "Reading article",
  search_wiki: "Searching wiki",
  get_article_html: "Getting article info",
  list_category_members: "Listing category",
};

export default function ToolCallCard({ tool }) {
  const [expanded, setExpanded] = useState(false);

  const label = TOOL_LABELS[tool.toolName] || tool.toolName;
  const argStr = tool.args && Object.keys(tool.args).length > 0
    ? Object.values(tool.args).join(", ")
    : "";

  return (
    <div className="tool-card">
      <button className="tool-header" onClick={() => tool.result && setExpanded(!expanded)}>
        <span className={`tool-icon ${tool.isLoading ? "spinning" : ""}`}>
          {tool.isLoading ? "⟳" : "✓"}
        </span>
        <span className="tool-label">{label}</span>
        {argStr && <span className="tool-args">{argStr}</span>}
        {tool.result && <span className="tool-expand">{expanded ? "▲" : "▼"}</span>}
      </button>
      {expanded && tool.result && (
        <pre className="tool-result">{tool.result}</pre>
      )}
    </div>
  );
}
