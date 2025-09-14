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

type Props = {
  docId: string;
  title?: string;
  initialContent: string;
  minimal?: boolean;
};

type EditorCommands = {
  undo: () => void;
  redo: () => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrike: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  setHeading: (level: 1 | 2 | 3) => void;
  setParagraph: () => void;
  setTextAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: string) => void;
  setColor: (color: string) => void;
  setHighlight: (color: string) => void;
  toggleLink: (url: string) => void;
  clearFormatting: () => void;
  align: (value: "left" | "center" | "right" | "justify") => void;
};

function Toolbar({ editor, commands, isActive }: { editor: any; commands: EditorCommands; isActive: (name: string, attributes?: Record<string, any>) => boolean }) {
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('14');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFontDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center p-2 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-1">
        {/* Font Family */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
            onClick={() => setShowFontDropdown(!showFontDropdown)}
          >
            {fontFamily}
          </button>
          {showFontDropdown && (
            <div className="absolute z-10 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg">
              {['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'].map((font) => (
                <button
                  key={font}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setFontFamily(font);
                    commands.setFontFamily(font);
                    setShowFontDropdown(false);
                  }}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size */}
        <div className="flex items-center border border-gray-300 rounded">
          <button
            className="px-2 py-1 text-gray-600 hover:bg-gray-100"
            onClick={() => {
              const newSize = Math.max(parseInt(fontSize) - 1, 1);
              setFontSize(newSize.toString());
              commands.setFontSize(`${newSize}px`);
            }}
          >
            -
          </button>
          <input
            type="number"
            className="w-12 text-center border-x border-gray-300 py-1 text-sm"
            value={fontSize}
            min="1"
            max="100"
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d+$/.test(value)) {
                setFontSize(value);
                if (value) {
                  commands.setFontSize(`${value}px`);
                }
              }
            }}
            onBlur={(e) => {
              if (!e.target.value) {
                setFontSize('14');
                commands.setFontSize('14px');
              }
            }}
          />
          <button
            className="px-2 py-1 text-gray-600 hover:bg-gray-100"
            onClick={() => {
              const newSize = Math.min(parseInt(fontSize) + 1, 100);
              setFontSize(newSize.toString());
              commands.setFontSize(`${newSize}px`);
            }}
          >
            +
          </button>
        </div>
      </div>

      <div className="border-l border-gray-300 h-6 mx-2"></div>

      {/* Text Formatting */}
      <div className="flex items-center space-x-0.5">
        <button
          type="button"
          className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${
            isActive('bold') ? 'bg-green-100 hover:bg-green-200' : 'hover:bg-gray-200'
          }`}
          onClick={() => commands.toggleBold()}
          title="Bold (Ctrl+B)"
        >
          <span className="material-symbols-outlined text-black" style={{ fontSize: '18px' }}>format_bold</span>
        </button>
        <button
          type="button"
          className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${
            isActive('italic') ? 'bg-green-100 hover:bg-green-200' : 'hover:bg-gray-200'
          }`}
          onClick={() => commands.toggleItalic()}
          title="Italic (Ctrl+I)"
        >
          <span className="material-symbols-outlined text-black" style={{ fontSize: '18px' }}>format_italic</span>
        </button>
        <button
          type="button"
          className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${
            isActive('underline') ? 'bg-green-100 hover:bg-green-200' : 'hover:bg-gray-200'
          }`}
          onClick={() => commands.toggleUnderline()}
          title="Underline (Ctrl+U)"
        >
          <span className="material-symbols-outlined text-black" style={{ fontSize: '18px' }}>format_underlined</span>
        </button>
      </div>
    </div>
  );
}

export default function FixedEditor({ docId, title, initialContent, minimal = false }: Props) {
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [documentTitle, setDocumentTitle] = useState(title || 'Untitled Document');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle);
  };

  const updateFormattingStates = (editor: any) => {
    if (!editor) return;
    setIsBold(editor.isActive('bold'));
    setIsItalic(editor.isActive('italic'));
    setIsUnderline(editor.isActive('underline'));
  };

  const [commands, setCommands] = useState<EditorCommands>({
    undo: () => {},
    redo: () => {},
    toggleBold: () => {},
    toggleItalic: () => {},
    toggleUnderline: () => {},
    toggleStrike: () => {},
    toggleBulletList: () => {},
    toggleOrderedList: () => {},
    setHeading: () => {},
    setParagraph: () => {},
    setTextAlign: () => {},
    setFontFamily: () => {},
    setFontSize: () => {},
    setColor: () => {},
    setHighlight: () => {},
    toggleLink: () => {},
    clearFormatting: () => {},
    align: () => {},
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      Highlight,
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc pl-6',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal pl-6',
        },
      }),
      ListItem,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline',
        },
      }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: initialContent ? JSON.parse(initialContent) : { type: 'doc', content: [] },
    autofocus: true,
    editorProps: {
      attributes: {
        class: minimal
          ? 'block w-full min-h-screen p-8 text-[15px] leading-7 outline-none focus:outline-none caret-black'
          : 'prose max-w-none outline-none focus:outline-none',
        style: 'white-space: pre-wrap;',
      },
    },
    onUpdate: ({ editor }) => {
      updateFormattingStates(editor);
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      saveTimeout.current = setTimeout(() => {
        // Save logic here
      }, 500);
    },
    onSelectionUpdate: ({ editor }) => {
      updateFormattingStates(editor);
    },
  });

  // Update commands when editor is ready
  useEffect(() => {
    if (!editor) return;

    const newCommands: EditorCommands = {
      undo: () => editor.chain().focus().undo().run(),
      redo: () => editor.chain().focus().redo().run(),
      toggleBold: () => editor.chain().focus().toggleBold().run(),
      toggleItalic: () => editor.chain().focus().toggleItalic().run(),
      toggleUnderline: () => editor.chain().focus().toggleUnderline().run(),
      toggleStrike: () => editor.chain().focus().toggleStrike().run(),
      toggleBulletList: () => editor.chain().focus().toggleBulletList().run(),
      toggleOrderedList: () => editor.chain().focus().toggleOrderedList().run(),
      setHeading: (level) => editor.chain().focus().toggleHeading({ level }).run(),
      setParagraph: () => editor.chain().focus().setParagraph().run(),
      setTextAlign: (alignment) => editor.chain().focus().setTextAlign(alignment).run(),
      setFontFamily: (fontFamily) => editor.chain().focus().setFontFamily(fontFamily).run(),
      setFontSize: (fontSize) => editor.chain().focus().setFontSize(fontSize).run(),
      setColor: (color) => editor.chain().focus().setColor(color).run(),
      setHighlight: (color) => editor.chain().focus().setHighlight({ color }).run(),
      toggleLink: (url) => {
        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        } else {
          editor.chain().focus().unsetLink().run();
        }
      },
      clearFormatting: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
      align: (value) => editor.chain().focus().setTextAlign(value).run(),
    };

    setCommands(newCommands);
  }, [editor]);

  const isActive = (name: string, attributes?: Record<string, any>) => {
    if (!editor) return false;
    return editor.isActive(name, attributes);
  };

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const save = useCallback(async () => {
    if (!editor) return;
    const json = editor.getJSON();
    // Implement save logic here
  }, [editor]);

  return (
    <div className="flex flex-col h-full">
      {!minimal && (
        <div className="px-4 py-2 border-b border-gray-200">
          <input
            type="text"
            className="w-full text-xl font-semibold border-none focus:outline-none"
            value={documentTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        </div>
      )}
      {!minimal && <Toolbar editor={editor} commands={commands} isActive={isActive} />}
      <EditorContent editor={editor} className="flex-1 overflow-auto" />
    </div>
  );
}
