"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { FontFamily } from "@tiptap/extension-font-family";
import Toolbar from "./Toolbar";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc, addDoc, collection, query, orderBy, limit, getDocs, type DocumentSnapshot, type DocumentData } from "firebase/firestore";
import Image from '@tiptap/extension-image'
import ImageResize from 'tiptap-extension-resize-image';

// Types
type Props = { docId: string; title?: string; initialContent: string; minimal?: boolean; };

// Simple divider
const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1"></div>;

// TopBar with File hover menu
function TopBar({ title, onTitleChange, onPrint, onExportPdf, onExportDocx, onToggleHistory, savingState, onInsertImageFile, onInsertImageUrl, onGenerateCitations }: {
  title?: string;
  onTitleChange?: (t: string) => void;
  onPrint?: () => void;
  onExportPdf?: () => void;
  onExportDocx?: () => void;
  onToggleHistory?: () => void;
  savingState?: 'idle' | 'saving' | 'saved';
  onInsertImageFile?: (file: File) => void;
  onInsertImageUrl?: (url: string) => void;
  onGenerateCitations?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title || 'Untitled Document');
  const [inputWidth, setInputWidth] = useState(150);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement | null>(null);
  const exportMenuTimer = useRef<number | null>(null);

  const openExportMenu = () => {
    if (exportMenuTimer.current) {
      window.clearTimeout(exportMenuTimer.current);
      exportMenuTimer.current = null;
    }
    setShowExportMenu(true);
  };

  const scheduleCloseExportMenu = () => {
    if (exportMenuTimer.current) window.clearTimeout(exportMenuTimer.current);
    exportMenuTimer.current = window.setTimeout(() => {
      setShowExportMenu(false);
      exportMenuTimer.current = null;
    }, 180);
  };

  // Close file menu on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!fileMenuRef.current) return;
      if (!fileMenuRef.current.contains(e.target as Node)) {
        setShowFileMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleTitleClick = () => {
    setIsEditing(true);
    setEditTitle(title || 'Untitled Document');
    setInputWidth(Math.max((title?.length || 15) * 11, 150));
  };

  const handleTitleSubmit = () => {
    setIsEditing(false);
    if (onTitleChange && editTitle.trim()) onTitleChange(editTitle.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSubmit();
    if (e.key === 'Escape') { setIsEditing(false); setEditTitle(title || 'Untitled Document'); }
  };

  return (
    <div className="px-4 py-4 bg-white">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[#1a73e8]" style={{ fontSize: '36px' }}>description</span>
        <div className="flex flex-col text-[18px] text-gray-800">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={e => { setEditTitle(e.target.value); setInputWidth(Math.max(e.target.value.length * 11, 150)); }}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="bg-transparent border border-blue-500 rounded px-1 py-0.5 outline-none focus:outline-none text-[18px] font-bold"
              style={{ width: `${inputWidth}px`, minHeight: '1.5rem' }}
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <p className="border border-transparent hover:bg-gray-100 hover:border-gray-300 rounded px-1 py-0.5 cursor-pointer font-bold" onClick={handleTitleClick}>
                {title || 'Untitled Document'}
              </p>
              {/* Saving / Saved indicator */}
              {savingState && savingState !== 'idle' && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {savingState === 'saving' ? (
                    <svg className="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined text-[16px] text-green-600">check_circle</span>
                  )}
                  <span>{savingState === 'saving' ? 'Saving…' : 'Saved'}</span>
                </div>
              )}
            </div>
          )}
          <div className="-ml-3 flex items-center gap-0">
            {/* File menu with dropdown and Export submenu */}
            <div className="relative" ref={fileMenuRef} onMouseEnter={() => setShowFileMenu(true)}>
              <button
                className="px-3 text-[13px] text-gray-800 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => setShowFileMenu(v => !v)}
              >
                File
              </button>
              {showFileMenu && (
                <div className="absolute left-0 mt-1 w-44 bg-white border border-gray-200 rounded shadow-md z-30 py-1 cursor-pointer text-xs">
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setShowFileMenu(false);
                      onPrint?.();
                    }}
                  >
                    Print
                  </button>
                  <div
                    className="relative"
                    onMouseEnter={openExportMenu}
                    onMouseLeave={scheduleCloseExportMenu}
                  >
                    <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between cursor-pointer">
                      <span>Export</span>
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                    {showExportMenu && (
                      <div
                        className="absolute top-0 left-full ml-1 w-44 bg-white border border-gray-200 rounded shadow-md z-40 py-1 cursor-pointer text-xs"
                        onMouseEnter={openExportMenu}
                        onMouseLeave={scheduleCloseExportMenu}
                      >
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setShowFileMenu(false);
                            setShowExportMenu(false);
                            onExportPdf?.();
                          }}
                        >
                          .pdf
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setShowFileMenu(false);
                            setShowExportMenu(false);
                            onExportDocx?.();
                          }}
                        >
                          .docx
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Insert dropdown */}
            <InsertMenu onInsertImageFile={onInsertImageFile} onInsertImageUrl={onInsertImageUrl} />

            {/* Tools dropdown (Generate citations) */}
            <ToolsMenu onGenerateCitations={onGenerateCitations} />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3 text-gray-600">
          <button
            type="button"
            className="h-8 px-3 rounded text-[13px] text-gray-800 hover:bg-gray-100 cursor-pointer"
            onClick={onToggleHistory}
            title="History"
          >
            History
          </button>
          <span className="material-symbols-outlined cursor-pointer" style={{ fontSize: '24px' }}>account_circle</span>
        </div>
      </div>
    </div>
  );
}

// Tools dropdown component
function ToolsMenu({ onGenerateCitations }: { onGenerateCitations?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        className="px-3 text-[13px] text-gray-800 hover:bg-gray-100 rounded cursor-pointer"
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(v => !v)}
      >
        Tools
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-md z-30 py-1 text-xs">
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              onGenerateCitations?.();
              setOpen(false);
            }}
          >
            Generate citations
          </button>
        </div>
      )}
    </div>
  );
}

// Insert dropdown component for TopBar
function InsertMenu({ onInsertImageFile, onInsertImageUrl }: { onInsertImageFile?: (file: File) => void; onInsertImageUrl?: (url: string) => void; }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        className="px-3 text-[13px] text-gray-800 hover:bg-gray-100 rounded"
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(v => !v)}
      >
        Insert
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-md z-30 py-1 text-xs">
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-50"
            onClick={() => inputRef.current?.click()}
          >
            Upload image
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onInsertImageFile) onInsertImageFile(file);
              e.currentTarget.value = '';
              setOpen(false);
            }}
          />
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-50"
            onClick={() => {
              const url = prompt('Enter image URL');
              if (url && onInsertImageUrl) onInsertImageUrl(url);
              setOpen(false);
            }}
          >
            Insert image link
          </button>
        </div>
      )}
    </div>
  );
}

// Trigger native browser print dialog using a hidden iframe
function triggerNativePrint(html: string) {
  // Create hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Print</title>
        <style>
          @page { margin: 1in; }
          body { font-family: Arial, sans-serif; color: #000; }
          .ProseMirror { max-width: 700px; margin: 0 auto; }
          img { max-width: 100%; }
          /* Optional: basic typography */
          h1,h2,h3,h4,h5,h6 { page-break-after: avoid; }
          p, li { orphans: 3; widows: 3; }
        </style>
      </head>
      <body>${html}</body>
    </html>`);
  doc.close();

  const onLoad = () => {
    // Give the browser a tick to render before printing
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Cleanup after a short delay to avoid interfering with the dialog
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 50);
  };

  // If the iframe document supports onload
  if (iframe.contentWindow) {
    iframe.onload = onLoad;
  } else {
    // Fallback: call directly
    onLoad();
  }
}

// Main EditorClient
export default function EditorClient({ docId, title, initialContent, minimal=false }: Props) {
  const saveTimeout = useRef<NodeJS.Timeout|null>(null);
  const [documentTitle, setDocumentTitle] = useState(title||'Untitled Document');
  const localSaveRef = useRef(false);
  const prevPlainTextRef = useRef<string>("");
  const prevContentJsonRef = useRef<any>(null);
  // Buffered keystrokes captured between saves
  const keystrokeBufferRef = useRef<Array<{ t: number; k: string; mods?: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean }; sel?: { from: number; to: number } }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<Array<{ id: string; createdAt?: any; plainText?: string; diffSummary?: any; keystrokes?: any[] }>>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<'idle'|'saving'|'saved'>('idle');
  const lastVersionWriteRef = useRef<number>(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextStyle,
      Color,
      FontFamily.configure({ types: ['textStyle'] }),
      TextAlign.configure({ types: ['heading','paragraph'] }),
      BulletList,
      OrderedList,
      ListItem,
      Image,
      ImageResize,
      Link.configure({ openOnClick:true }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: initialContent ? JSON.parse(initialContent) : { type:"doc", content: [] },
    autofocus: true,
    editorProps: { attributes: { class: minimal ? "block w-full min-h-screen p-8 text-[15px] leading-7 outline-none caret-black" : "prose max-w-none outline-none" } },
    onUpdate: () => scheduleSave(),
    immediatelyRender: false,
  });

  // Insert helpers for TopBar Insert menu
  const handleInsertImageFile = useCallback((file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor?.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  }, [editor]);

  const handleInsertImageUrl = useCallback((url: string) => {
    if (!url || !url.trim()) return;
    editor?.chain().focus().setImage({ src: url.trim() }).run();
  }, [editor]);

  // Simple Generate Citations stub: prompts for a URL/DOI and inserts a link at cursor
  const handleGenerateCitations = useCallback(() => {
    const url = prompt('Enter a URL or DOI to cite');
    if (!url || !url.trim()) return;
    const text = `Citation: ${url.trim()}`;
    editor?.chain().focus().insertContent(text).setTextSelection({ from: editor.state.selection.from, to: editor.state.selection.from + text.length }).run();
  }, [editor]);

  // Attach keydown listener to capture keystrokes
  useEffect(() => {
    if (!editor) return;
    const handler = (e: KeyboardEvent) => {
      // Ignore very noisy keys like CapsLock or pure modifier presses
      const ignorable = ["CapsLock", "NumLock", "ScrollLock", "Shift", "Control", "Alt", "Meta"];
      if (ignorable.includes(e.key)) return;
      const sel = editor.state.selection;
      const entry = {
        t: Date.now(),
        k: e.key,
        mods: { ctrl: e.ctrlKey || undefined, alt: e.altKey || undefined, shift: e.shiftKey || undefined, meta: e.metaKey || undefined },
        sel: { from: sel.from, to: sel.to },
      };
      const buf = keystrokeBufferRef.current;
      buf.push(entry);
      // Cap buffer to reasonable size to avoid unbounded growth
      if (buf.length > 1000) buf.splice(0, buf.length - 1000);
    };
    const dom = editor.view.dom as HTMLElement;
    dom.addEventListener('keydown', handler, { capture: true });
    return () => {
      dom.removeEventListener('keydown', handler, { capture: true } as any);
    };
  }, [editor]);

  const scheduleSave = useCallback(() => {
    if(saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => { void save(); }, 400);
  }, [editor]);

  async function save() {
    if(!editor) return;
    setSavingState('saving');
    const contentJson = editor.getJSON();
    const plainText = editor.getText().slice(0, 20000);
    const ref = doc(db, 'docs', docId);
    localSaveRef.current = true;
    await setDoc(ref, {
      title: documentTitle || 'Untitled Document',
      author: null,
      // Streamlined frequent save payload
      content: contentJson,
      plainText,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    // release the local save flag shortly after to allow remote updates
    setTimeout(() => { localSaveRef.current = false; }, 200);

    // Write a version entry for deep history
    try {
      const versionsCol = collection(ref, 'versions');
      const prev = prevPlainTextRef.current || '';
      const prevLen = prev.length;
      const newLen = plainText.length;
      const prevWords = prev.trim() ? prev.trim().split(/\s+/).length : 0;
      const newWords = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
      // very lightweight content hash based on JSON length and first 120 chars of text
      const contentHash = `${JSON.stringify(contentJson).length}-${plainText.slice(0,120)}`;
      const now = Date.now();
      if (now - lastVersionWriteRef.current > 5000) {
        await addDoc(versionsCol, {
          title: documentTitle || 'Untitled Document',
          author: null,
          content: contentJson,
          plainText,
          keystrokes: keystrokeBufferRef.current,
          diffSummary: {
            prevLength: prevLen,
            newLength: newLen,
            deltaLength: newLen - prevLen,
            prevWords,
            newWords,
            deltaWords: newWords - prevWords,
            contentHash,
          },
          createdAt: serverTimestamp(),
        });
        prevPlainTextRef.current = plainText;
        prevContentJsonRef.current = contentJson;
        // reset keystroke buffer after we persisted it with the version
        keystrokeBufferRef.current = [];
        lastVersionWriteRef.current = now;
      }
    } catch (e) {
      // swallow diff/version errors to not block editing
      // console.warn('version write failed', e);
    }
    setSavingState('saved');
    setTimeout(() => setSavingState('idle'), 1200);
  }

  // Helpers to sanitize filename
  const buildFilename = useCallback((ext: string) => {
    const base = (documentTitle || 'document').replace(/[^\w\-]+/g, '_').slice(0, 60) || 'document';
    return `${base}.${ext}`;
  }, [documentTitle]);

  // Export current editor HTML to PDF using html2pdf.js
  const handleExportPdf = useCallback(async () => {
    if (!editor) return;
    const html = editor.getHTML();
    const { default: html2pdf } = await import('html2pdf.js');
    // Create a container to render html for conversion
    const container = document.createElement('div');
    container.style.padding = '1in';
    container.innerHTML = html;
    document.body.appendChild(container);
    try {
      await (html2pdf() as any)
        .set({
          margin: 0,
          filename: buildFilename('pdf'),
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        })
        .from(container)
        .save();
    } finally {
      document.body.removeChild(container);
    }
  }, [editor, buildFilename]);

  // Export current editor HTML to DOCX using html-docx-js
  const handleExportDocx = useCallback(async () => {
    if (!editor) return;
    const html = editor.getHTML();
    const { default: htmlDocx } = await import('html-docx-js/dist/html-docx');
    const docHtml = `<!doctype html><html><head><meta charset="utf-8" /></head><body>${html}</body></html>`;
    const blob = htmlDocx.asBlob(docHtml, {
      orientation: 'portrait',
      margins: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5in margins (twips)
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = buildFilename('docx');
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }, [editor, buildFilename]);

  useEffect(() => {
    if (!docId) return;
    const ref = doc(db, 'docs', docId);

    // Load initial data (once). Prefer latest version if present, otherwise use base doc.
    (async () => {
      const snap = await getDoc(ref);
      // Try latest version
      const vq = query(collection(ref, 'versions'), orderBy('createdAt', 'desc'), limit(1));
      const vSnap = await getDocs(vq);
      const latestVersion = !vSnap.empty ? (vSnap.docs[0].data() as any) : null;

      if (latestVersion && editor) {
        // Use versioned content, but prefer canonical title from the base doc if available
        const data = snap.exists() ? (snap.data() as any) : null;
        const titleToUse = (data?.title && typeof data.title === 'string' && data.title.trim()) ? data.title : (latestVersion.title || documentTitle);
        setDocumentTitle(titleToUse);
        if (latestVersion.content) editor.commands.setContent(latestVersion.content);
        prevPlainTextRef.current = latestVersion.plainText || '';
        prevContentJsonRef.current = latestVersion.content || null;
      } else if (snap.exists()) {
        const data = snap.data() as any;
        setDocumentTitle(data.title || documentTitle);
        if (editor && data.content) editor.commands.setContent(data.content);
        prevPlainTextRef.current = data.plainText || '';
        prevContentJsonRef.current = data.content || null;
      } else {
        // Seed a new document in Firestore
        const seedContent = editor ? editor.getJSON() : { type: 'doc', content: [] };
        localSaveRef.current = true;
        await setDoc(ref, {
          title: documentTitle || 'Untitled Document',
          author: null,
          content: seedContent,
          plainText: editor ? editor.getText().slice(0, 20000) : '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        prevPlainTextRef.current = editor ? editor.getText().slice(0, 20000) : '';
        prevContentJsonRef.current = seedContent;
        setTimeout(() => { localSaveRef.current = false; }, 200);
      }
    })();

    const unsub = onSnapshot(ref, (snap: DocumentSnapshot<DocumentData>) => {
      if (!snap.exists()) return;
      const data = snap.data() as any;
      // Avoid applying our own local save immediately
      if (localSaveRef.current) return;
      // Update title if changed
      if (data.title && data.title !== documentTitle) setDocumentTitle(data.title);
      // Update editor content if different
      if (editor && data.content) {
        try {
          const current = editor.getJSON();
          // naive diff by JSON stringify length/keys
          if (JSON.stringify(current) !== JSON.stringify(data.content)) {
            editor.commands.setContent(data.content);
          }
        } catch {}
      }
    });

    return () => {
      if(saveTimeout.current) clearTimeout(saveTimeout.current);
      unsub();
    }
  }, [docId, editor]);

  // Subscribe to recent versions when the History panel is open
  useEffect(() => {
    if (!showHistory) return;
    const ref = doc(db, 'docs', docId);
    const versionsRef = collection(ref, 'versions');
    const q = query(versionsRef, orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setVersions(list);
      if (!selectedVersionId && list.length) setSelectedVersionId(list[0].id);
    });
    return () => unsub();
  }, [showHistory, docId, selectedVersionId]);

  // Save title changes to Firestore
  const handleTopbarTitleChange = useCallback(async (newTitle: string) => {
    setDocumentTitle(newTitle);
    const ref = doc(db, 'docs', docId);
    localSaveRef.current = true;
    setSavingState('saving');
    await setDoc(ref, { title: newTitle, updatedAt: serverTimestamp() }, { merge: true });
    setTimeout(() => { localSaveRef.current = false; }, 200);
    setSavingState('saved');
    setTimeout(() => setSavingState('idle'), 1200);
  }, [docId]);

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        {!minimal && (
          <TopBar
            title={documentTitle}
            onTitleChange={handleTopbarTitleChange}
            onPrint={() => {
              if (editor) {
                triggerNativePrint(editor.getHTML());
              }
            }}
            onExportPdf={handleExportPdf}
            onExportDocx={handleExportDocx}
            onToggleHistory={() => setShowHistory(v => !v)}
            savingState={savingState}
            onInsertImageFile={handleInsertImageFile}
            onInsertImageUrl={handleInsertImageUrl}
            onGenerateCitations={handleGenerateCitations}
          />
        )}
        {!minimal && <Toolbar editor={editor} />}
      </div>
      <div className="overflow-auto">
        <div className="py-8 flex justify-center">
          <div className="w-[816px] min-h-[1056px] p-8 bg-light-gray rounded-lg shadow-sm">
            <EditorContent editor={editor} className={minimal ? "p-0 text-black" : "p-4 max-w-none text-black"} />
          </div>
        </div>
      </div>

    {/* Right-side History Panel */}
    {showHistory && (
      <div className="fixed top-0 right-0 h-full w-[360px] bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="font-semibold">Version History</div>
          <button className="text-sm text-gray-600 hover:text-gray-800" onClick={() => setShowHistory(false)}>Close</button>
        </div>
        <div className="flex-1 grid grid-cols-1" style={{ gridTemplateRows: '1fr 1fr' }}>
          {/* Versions list */}
          <div className="overflow-auto border-b">
            <ul className="divide-y divide-gray-100">
              {versions.map(v => (
                <li key={v.id} className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedVersionId===v.id? 'bg-blue-50':''}`} onClick={() => setSelectedVersionId(v.id)}>
                  <div className="text-sm font-medium">{new Date(v.createdAt?.toDate?.() || v.createdAt || Date.now()).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Chars: {v.plainText?.length ?? '—'} • Keys: {v.keystrokes?.length ?? 0}</div>
                  {v.diffSummary && (
                    <div className="text-[11px] text-gray-500 mt-1">
                      ΔLen {v.diffSummary.deltaLength} • ΔWords {v.diffSummary.deltaWords}
                    </div>
                  )}
                </li>
              ))}
              {versions.length===0 && (
                <li className="p-3 text-sm text-gray-500">No versions yet.</li>
              )}
            </ul>
          </div>
          {/* Keystrokes viewer */}
          <div className="overflow-auto">
            <div className="p-3 border-b font-medium">Keystrokes</div>
            <div className="p-3 text-xs">
              {(() => {
                const current = versions.find(v => v.id === selectedVersionId);
                const ks = (current?.keystrokes || []) as any[];
                if (!ks.length) return <div className="text-gray-500">No keystrokes recorded for this version.</div>;
                return (
                  <ul className="space-y-1">
                    {ks.map((k, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>{new Date(k.t).toLocaleTimeString()} — {k.k}</span>
                        <span className="text-gray-500">sel[{k.sel?.from}:{k.sel?.to}]</span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

}
