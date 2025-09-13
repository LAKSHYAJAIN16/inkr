import { notFound } from "next/navigation";
import { readDoc } from "@/lib/storage";
import EditorClient from "@/components/EditorClient";

export default async function DocPage({ params }: { params: { id: string } }) {
  let doc;
  try {
    doc = await readDoc(params.id);
  } catch {
    return notFound();
  }
  
  return (
    <EditorClient 
      docId={doc.id} 
      title={doc.title} 
      initialContent={doc.current.content} 
    />
  );
}
