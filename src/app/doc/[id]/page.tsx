import EditorClient from "@/components/EditorClient";

export default function DocPage({ params }: { params: { id: string } }) {
  // Firestore-backed: EditorClient will load/create the doc client-side.
  return (
    <EditorClient
      docId={params.id}
      title={"Untitled Document"}
      initialContent={JSON.stringify({ type: "doc", content: [] })}
    />
  );
}
