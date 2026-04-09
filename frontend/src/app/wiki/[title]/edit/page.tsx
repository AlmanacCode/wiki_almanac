import { getPageSource, getParsedPage } from "@/lib/api";
import { EditorPane } from "./EditorPane";

export default async function EditPage({
  params,
}: {
  params: Promise<{ title: string }>;
}) {
  const { title } = await params;
  const decoded = decodeURIComponent(title);

  const [source, parsed] = await Promise.all([
    getPageSource(decoded),
    getParsedPage(decoded),
  ]);

  return (
    <EditorPane
      title={decoded}
      initialSource={source.source}
      initialHtml={parsed.text}
    />
  );
}
