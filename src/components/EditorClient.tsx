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

// Code block syntax highlighting can be added later. Keeping minimal to avoid SSR issues.

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

// Simple divider for the toolbar
const Divider = () => (
  <div className="w-px h-6 bg-gray-300 mx-1"></div>
);

// Top bar component
function TopBar({ title }: { title?: string }) {
  return (
    <div className="h-12 px-3 flex items-center gap-3 bg-white border-b">
      <span className="material-symbols-outlined text-[#1a73e8]">description</span>
      <div className="text-[15px] text-gray-800 font-medium truncate max-w-[40%]">
        {title || 'Untitled Document'}
      </div>
      <div className="ml-auto flex items-center gap-3 text-gray-600">
        <button className="h-8 px-4 rounded-full bg-[#1a73e8] text-white text-sm">Share</button>
        <span className="material-symbols-outlined">account_circle</span>
      </div>
    </div>
  );
}

// Menu bar component
function MenuBar() {
  const item = "px-2 py-2 text-[13px] text-gray-700 hover:bg-gray-100 rounded";
  return (
    <div className="h-10 px-2 flex items-center gap-1 bg-white">
      {['File','Edit','View','Insert','Format','Tools','Extensions','Help'].map((m) => (
        <button key={m} className={item}>{m}</button>
      ))}
    </div>
  );
}

// Ruler component
function Ruler() {
  return (
    <div className="h-9 px-4 flex items-center bg-[#f8f9fa] border-b border-t">
      <div className="text-xs text-gray-500">
        <span className="mr-4">Page 1 of 1</span>
        <span>0 words</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">
          <span className="material-symbols-outlined text-lg">zoom_out</span>
        </button>
        <div className="text-xs text-gray-500 w-10 text-center">100%</div>
        <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">
          <span className="material-symbols-outlined text-lg">zoom_in</span>
        </button>
      </div>
    </div>
  );
}

// Toolbar component with all formatting options
function Toolbar({ 
  editor, 
  commands, 
  isActive 
}: { 
  editor: any; 
  commands: EditorCommands; 
  isActive: (name: string, attributes?: Record<string, any>) => boolean;
}) {
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('14px');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const fontSizes = [
    '8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'
  ];

  const fontFamilies = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Arial Black', value: 'Arial Black, sans-serif' },
    { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Impact', value: 'Impact, sans-serif' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Roboto Condensed', value: 'Roboto Condensed, sans-serif' },
    { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif' }
  ];

  const handleFontFamilyChange = (font: string) => {
    commands.setFontFamily(font);
    setFontFamily(font);
    setShowFontDropdown(false);
  };

  const handleFontSizeChange = (size: string) => {
    commands.setFontSize(size);
    setFontSize(size);
    setShowFontSizeDropdown(false);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkUrl) {
      commands.toggleLink(linkUrl);
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  if (!editor) return null;

  return (
    <div className="h-10 px-3 flex items-center bg-white border-b border-t">
      {/* Font Family */}
      <div className="relative mr-2">
        <button 
          className="h-8 px-2 text-sm text-gray-800 bg-white border rounded hover:bg-gray-100 flex items-center"
          onClick={() => setShowFontDropdown(!showFontDropdown)}
        >
          <span style={{ fontFamily }} className="truncate max-w-[100px]">
            {fontFamilies.find(f => f.value === fontFamily)?.name || fontFamily}
          </span>
          <span className="material-symbols-outlined text-sm ml-1">arrow_drop_down</span>
        </button>
        {showFontDropdown && (
          <div className="absolute z-10 mt-1 w-48 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
            {fontFamilies.map((font) => (
              <button
                key={font.value}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${fontFamily === font.value ? 'bg-blue-50 text-blue-600' : 'text-gray-800'}`}
                style={{ fontFamily: font.value }}
                onClick={() => handleFontFamilyChange(font.value)}
              >
                {font.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font Size */}
      <div className="relative mr-2">
        <button 
          className="h-8 px-2 text-sm text-gray-800 bg-white border rounded hover:bg-gray-100"
          onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
        >
          {fontSize} pt
          <span className="material-symbols-outlined text-sm ml-1">arrow_drop_down</span>
        </button>
        {showFontSizeDropdown && (
          <div className="absolute z-10 mt-1 w-20 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
            {fontSizes.map((size) => (
              <button
                key={size}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${fontSize === size ? 'bg-blue-50 text-blue-600' : 'text-gray-800'}`}
                onClick={() => handleFontSizeChange(size)}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Text Formatting */}
      <div className="flex items-center space-x-1">
        <button
          className={`p-1 rounded ${isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => commands.toggleBold()}
          title="Bold (Ctrl+B)"
        >
          <span className="material-symbols-outlined">format_bold</span>
        </button>
        <button
          className={`p-1 rounded ${isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => commands.toggleItalic()}
          title="Italic (Ctrl+I)"
        >
          <span className="material-symbols-outlined">format_italic</span>
        </button>
        <button
          className={`p-1 rounded ${isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => commands.toggleUnderline()}
          title="Underline (Ctrl+U)"
        >
          <span className="material-symbols-outlined">format_underlined</span>
        </button>
        <button
          className={`p-1 rounded ${isActive('strike') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => commands.toggleStrike()}
          title="Strikethrough"
        >
          <span className="material-symbols-outlined">strikethrough_s</span>
        </button>
      </div>

      <Divider />

      {/* Text Alignment */}
      <div className="flex items-center space-x-1">
        <button
          className={`p-1 rounded ${isActive('textAlign', { textAlign: 'left' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => commands.setTextAlign('left')}
          title="Align left (Ctrl+Shift+L)"
        >
          <span className="material-symbols-outlined">format_align_left</span>
        </button>
        <button
          className={`p-1 rounded ${isActive('textAlign', { textAlign: 'center' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => commands.setTextAlign('center')}
          title="Center (Ctrl+Shift+E)"
        >
          <span className="material-symbols-outlined">format_align_center</span>
        </button>
        <button
          className={`p-1 rounded ${isActive('textAlign', { textAlign: 'right' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => commands.setTextAlign('right')}
          title="Align right (Ctrl+Shift+R)"
        >
          <span className="material-symbols-outlined">format_align_right</span>
        </button>
        <button
          className={`p-1 rounded ${isActive('textAlign', { textAlign: 'justify' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => commands.setTextAlign('justify')}
          title="Justify (Ctrl+Shift+J)"
        >
          <span className="material-symbols-outlined">format_align_justify</span>
        </button>
      </div>

      <Divider />

      {/* Lists */}
      <div className="flex items-center space-x-1">
        <button
          className={`p-1 rounded ${isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => commands.toggleBulletList()}
          title="Bullet list"
        >
          <span className="material-symbols-outlined">format_list_bulleted</span>
        </button>
        <button
          className={`p-1 rounded ${isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => commands.toggleOrderedList()}
          title="Numbered list"
        >
          <span className="material-symbols-outlined">format_list_numbered</span>
        </button>
      </div>

      <Divider />

      {/* More Formatting */}
      <div className="flex items-center space-x-1">
        <button
          className={`p-1 rounded ${isActive('link') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => setShowLinkInput(!showLinkInput)}
          title="Insert link (Ctrl+K)"
        >
          <span className="material-symbols-outlined">link</span>
        </button>
        {showLinkInput && (
          <form onSubmit={handleLinkSubmit} className="absolute z-10 mt-1 p-2 bg-white border rounded shadow-lg">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL"
              className="p-1 border rounded"
              autoFocus
            />
            <button type="submit" className="ml-2 px-2 py-1 bg-blue-500 text-white rounded">
              Apply
            </button>
          </form>
        )}
        <button
          className="p-1 rounded hover:bg-gray-100"
          onClick={() => commands.clearFormatting()}
          title="Clear formatting (Ctrl+\")"
        >
          <span className="material-symbols-outlined">format_clear</span>
        </button>
      </div>

      <div className="ml-auto flex items-center space-x-1">
        <button
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
          onClick={() => commands.undo()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <span className="material-symbols-outlined">undo</span>
        </button>
        <button
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
          onClick={() => commands.redo()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <span className="material-symbols-outlined">redo</span>
        </button>
      </div>
    </div>
  );
}

export default function EditorClient({ docId, title, initialContent, minimal = false }: Props) {
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('14px');
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
    content: initialContent ? JSON.parse(initialContent) : { type: "doc", content: [] },
    autofocus: true,
    // Configure editor properties with proper SSR handling
    editorProps: {
      attributes: {
        class: minimal
          ? "block w-full min-h-screen p-8 text-[15px] leading-7 outline-none focus:outline-none caret-black"
          : "prose max-w-none outline-none focus:outline-none",
        style: "white-space: pre-wrap;",
      },
    },
    // Ensure the editor doesn't try to render on the server
    onUpdate: () => scheduleSave(),
    // Explicitly set to false to prevent hydration issues
    immediatelyRender: false,
  });

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      void save();
    }, 1000);
  }, [editor]);

  const plainText = useMemo(() => editor?.getText() || "", [editor]);

  async function save() {
    if (!editor) return;
    const json = JSON.stringify(editor.getJSON());
    await fetch(`/api/docs/${docId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: json, plainText: plainText.slice(0, 20000) }),
    });
  }

  // Register commands to outer toolbar when editor is ready
  const registerCommands = useCallback((editor: any): EditorCommands => {
    if (!editor) return {
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
    };
    
    const commands: EditorCommands = {
      undo: () => editor.chain().focus().undo().run(),
      redo: () => editor.chain().focus().redo().run(),
      toggleBold: () => editor.chain().focus().toggleBold().run(),
      toggleItalic: () => editor.chain().focus().toggleItalic().run(),
      toggleUnderline: () => editor.chain().focus().toggleUnderline().run(),
      toggleStrike: () => editor.chain().focus().toggleStrike().run(),
      toggleBulletList: () => editor.chain().focus().toggleBulletList().run(),
      toggleOrderedList: () => editor.chain().focus().toggleOrderedList().run(),
      setHeading: (level: number) => editor.chain().focus().setHeading({ level }).run(),
      setParagraph: () => editor.chain().focus().setParagraph().run(),
      setTextAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => {
        if (alignment === 'left') return editor.chain().focus().setTextAlign('left').run();
        if (alignment === 'center') return editor.chain().focus().setTextAlign('center').run();
        if (alignment === 'right') return editor.chain().focus().setTextAlign('right').run();
        if (alignment === 'justify') return editor.chain().focus().setTextAlign('justify').run();
        return false;
      },
      setFontFamily: (font: string) => {
        editor.chain().focus().setFontFamily(font).run();
        setFontFamily(font);
        return true;
      },
      setFontSize: (size: string) => {
        editor.chain().focus().setFontSize(size).run();
        setFontSize(size);
        return true;
      },
      setColor: (color: string) => editor.chain().focus().setColor(color).run(),
      setHighlight: (color: string) => editor.chain().focus().setHighlight({ color }).run(),
      toggleLink: (url: string) => {
        if (url) {
          return editor.chain().focus().setLink({ href: url }).run();
        } else {
          return editor.chain().focus().unsetLink().run();
        }
      },
      clearFormatting: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
      align: (alignment: 'left' | 'center' | 'right' | 'justify') => {
        return editor.chain().focus().setTextAlign(alignment).run();
      },
    };
    
    return commands;
  }, []);

  const register = useRegisterCommands();
  
  useEffect(() => {
    if (!editor) return;
    
    const commands = registerCommands(editor);
    
    // Add the align command to the commands object
    const fullCommands = {
      ...commands,
      align: (v: 'left' | 'center' | 'right' | 'justify') => 
        editor.chain().focus().setTextAlign(v).run()
    };
    
    register(fullCommands);
  }, [editor, register, registerCommands]);

  // Check if a command is currently active
  const isActive = (name: string, attributes?: Record<string, any>) => {
    if (!editor) return false;
    
    if (name === 'heading') {
      return editor.isActive('heading', { level: attributes?.level });
    }
    
    if (name === 'textStyle' && attributes?.fontFamily) {
      return editor.isActive('textStyle', { fontFamily: attributes.fontFamily });
    }
    
    if (name === 'textAlign' && attributes?.textAlign) {
      return editor.isActive({ textAlign: attributes.textAlign });
    }
    
    return editor.isActive(name, attributes);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      {!minimal && (
        <>
          <TopBar title={title} />
          <MenuBar />
          <Toolbar editor={editor} commands={commands} isActive={isActive} />
          <Ruler />
        </>
      )}
      
      <div className="flex-1 overflow-auto">
        <div className="py-8 flex justify-center">
          <div className="bg-white shadow-md w-[816px] min-h-[1056px] border border-gray-200 p-8">
            <EditorContent 
              editor={editor} 
              className={minimal ? "p-0 text-black" : "p-4 max-w-none text-black"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


  
  const base = "h-8 px-2 text-[13px] text-[#202124] hover:bg-gray-100 rounded disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center";
  const activeClass = "bg-gray-200 hover:bg-gray-200";
  const divider = "w-px h-6 bg-gray-300 mx-1";
  
  const isActive = (name: string, attributes?: any) => {
    if (!editor) return false;
    if (typeof name === 'object') {
      return editor.isActive(attributes);
    }
    return editor.isActive(name, attributes);
  };
  
  const handleLink = () => {
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      commands.toggleLink(url);
    }
  };

  const handleColorChange = () => {
    const color = prompt('Enter color (e.g., #FF0000, blue, rgb(255, 0, 0))', '#000000');
    if (color) {
      commands.setColor(color);
    }
  };

  const handleHighlight = () => {
    const color = prompt('Enter highlight color (e.g., #FFFF00, yellow, rgba(255, 255, 0, 0.5))', '#FFFF00');
    if (color) {
      commands.setHighlight(color);
    }
  };
  
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value;
    setFontFamily(font);
    commands.setFontFamily(font);
  };
  
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    setFontSize(size);
    commands.setFontSize(`${size}px`);
  };
  
  const fontFamilies = [
    'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 
    'Georgia', 'Impact', 'Tahoma', 'Times New Roman', 
    'Trebuchet MS', 'Verdana', 'Roboto', 'Open Sans'
  ];
  
  const fontSizes = [
    '8', '9', '10', '11', '12', '14', '16', 
    '18', '20', '22', '24', '26', '28', '30', '36', '48', '72'
  ];

  return (
    <div className="flex items-center px-4 py-2 border-b border-gray-200 bg-white shadow-sm">
      {/* Undo/Redo */}
      <div className="flex items-center mr-4">
        <button 
          className={`w-8 h-8 rounded-full flex items-center justify-center ${!editor?.can().undo() ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={commands.undo}
          title="Undo (Ctrl+Z)"
          disabled={!editor?.can().undo()}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
          </svg>
        </button>
        <button 
          className={`w-8 h-8 rounded-full flex items-center justify-center ml-1 ${!editor?.can().redo() ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={commands.redo}
          title="Redo (Ctrl+Y)"
          disabled={!editor?.can().redo()}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L19 8v9h-9l2.4-2.4z"/>
          </svg>
        </button>
      </div>
      
      <div className={divider}></div>
      
      {/* Font Family Dropdown */}
      <div className="relative group ml-2">
        <button 
          className={`h-8 px-2 min-w-[120px] text-left text-sm text-gray-800 bg-white border-0 rounded hover:bg-gray-100 flex items-center justify-between ${isActive('textStyle', { fontFamily }) ? 'bg-gray-200' : ''}`}
          title="Font"
        >
          <span style={{ fontFamily }}>{fontFamily}</span>
          <svg className="w-4 h-4 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="absolute group-hover:block bg-white shadow-lg rounded-md mt-1 py-1 z-50 max-h-80 overflow-y-auto w-48">
          {[
            { name: 'Arial', value: 'Arial, sans-serif' },
            { name: 'Arial Black', value: 'Arial Black, sans-serif' },
            { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
            { name: 'Courier New', value: 'Courier New, monospace' },
            { name: 'Georgia', value: 'Georgia, serif' },
            { name: 'Impact', value: 'Impact, sans-serif' },
            { name: 'Tahoma', value: 'Tahoma, sans-serif' },
            { name: 'Times New Roman', value: 'Times New Roman, serif' },
            { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
            { name: 'Verdana', value: 'Verdana, sans-serif' },
            { name: 'Roboto', value: 'Roboto, sans-serif' },
            { name: 'Open Sans', value: 'Open Sans, sans-serif' },
            { name: 'Lato', value: 'Lato, sans-serif' },
            { name: 'Montserrat', value: 'Montserrat, sans-serif' },
            { name: 'Roboto Condensed', value: 'Roboto Condensed, sans-serif' },
            { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif' }
          ].map((font) => (
            <button
              key={font.value}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${fontFamily === font.value ? 'bg-blue-50 text-blue-600' : 'text-gray-800'}`}
              onClick={() => {
                setFontFamily(font.value);
                commands.setFontFamily(font.value);
              }}
              style={{ fontFamily: font.value }}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Font Size */}
      <div className="relative ml-1 mr-2">
        <select 
          className="h-8 pl-2 pr-8 text-sm text-gray-800 bg-white border-0 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={fontSize}
          onChange={handleFontSizeChange}
          title="Font Size"
        >
          {fontSizes.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>
      
      <div className={divider}></div>
      
      {/* Text Formatting */}
      <div className="flex items-center ml-1">
        <button 
          className={`w-8 h-8 rounded flex items-center justify-center ${isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          onClick={commands.toggleBold}
          title="Bold (Ctrl+B)"
          disabled={!editor?.can().chain().focus().toggleBold().run()}
        >
          <span className="font-bold">B</span>
        </button>
        <button 
          className={`w-8 h-8 rounded flex items-center justify-center ${isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          onClick={commands.toggleItalic}
          title="Italic (Ctrl+I)"
          disabled={!editor?.can().chain().focus().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </button>
        <button 
          className={`w-8 h-8 rounded flex items-center justify-center ${isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          onClick={commands.toggleUnderline}
          title="Underline (Ctrl+U)"
          disabled={!editor?.can().chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </button>
        <button 
          className={`w-8 h-8 rounded flex items-center justify-center ${isActive('strike') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          onClick={commands.toggleStrike}
          title="Strikethrough (Alt+Shift+5)"
          disabled={!editor?.can().chain().focus().toggleStrike().run()}
        >
          <span className="line-through">S</span>
        </button>
      
      </div>
      
      <div className={divider}></div>
      
      {/* Lists */}
      <div className="flex items-center">
        <button 
          className={`w-8 h-8 rounded flex items-center justify-center ${isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          onClick={commands.toggleBulletList}
          title="Bullet List"
          disabled={!editor?.can().chain().focus().toggleBulletList().run()}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
          </svg>
        </button>
        <button 
          className={`w-8 h-8 rounded flex items-center justify-center ${isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          onClick={commands.toggleOrderedList}
          title="Numbered List"
          disabled={!editor?.can().chain().focus().toggleOrderedList().run()}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
          </svg>
        </button>
      </div>
      
      <div className={divider}></div>
      
      {/* Headings & Text Styles */}
      <div className="flex items-center">
        <select 
          className="h-8 pl-2 pr-8 text-sm text-gray-800 bg-white border-0 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={isActive('heading', { level: 1 }) ? 'h1' : isActive('heading', { level: 2 }) ? 'h2' : isActive('heading', { level: 3 }) ? 'h3' : 'p'}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'p') commands.setParagraph();
            else if (value === 'h1') commands.setHeading(1);
            else if (value === 'h2') commands.setHeading(2);
            else if (value === 'h3') commands.setHeading(3);
          }}
          title="Text Style"
        >
          <option value="p">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
      </div>
      
      <div className={divider}></div>
      
      {/* Text Alignment */}
      <div className="flex items-center">
        <button 
          className={`w-8 h-8 rounded flex items-center justify-center ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          onClick={() => commands.setTextAlign('left')}
          title="Align Left (Ctrl+Shift+L)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
          </svg>
        </button>
        <button 
          className={`w-8 h-8 rounded flex items-center justify-center ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          onClick={() => commands.setTextAlign('center')}
          title="Center (Ctrl+Shift+E)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 15v2h10v-2H7zm-4 4h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V5H7z"/>
          </svg>
        </button>
        <button 
          className={`w-8 h-8 rounded flex items-center justify-center ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          onClick={() => commands.setTextAlign('right')}
          title="Align Right (Ctrl+Shift+R)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
          </svg>
        </button>
        <button 
          className={`w-8 h-8 rounded flex items-center justify-center ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          onClick={() => commands.setTextAlign('justify')}
          title="Justify (Ctrl+Shift+J)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
          </svg>
        </button>
      </div>
      
      <div className={divider}></div>
      
      {/* Text Color & Highlight */}
      <div className="flex items-center">
        <div className="relative group">
          <button 
            className={`w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100`} 
            title="Text Color"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 20h20v4H2v-4zm3.49-3h2.42l1.8-8H18v-2h-5.16l-.2.95c.39-.27.82-.48 1.28-.6.6-.15 1.24-.1 1.81.15.58.25 1.05.69 1.34 1.25.29.56.37 1.2.23 1.8-.15.6-.53 1.12-1.07 1.47-.53.35-1.17.53-1.8.5-1.04 0-2.04-.5-2.64-1.35l-1.28 5.43H5.5l-1.01-4.9zM12.08 5L12 5.5V8h5.5V5h-5.42z"/>
            </svg>
          </button>
          <div className="absolute hidden group-hover:block bg-white shadow-lg rounded p-2 z-10">
            <div className="grid grid-cols-5 gap-1">
              {['#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#FFFFFF', '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF'].map(color => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-gray-200"
                  style={{ backgroundColor: color }}
                  onClick={() => commands.setColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="relative group ml-1">
          <button 
            className={`w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100`} 
            title="Highlight Color"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 14l3 3v5h6v-5l3-3V9H6v5zm5-12h2v3h-2V2zM3.5 5.88l1.41-1.41 2.12 2.12L5.62 8 3.5 5.88zm13.46.71l2.12-2.12 1.41 1.41L18.38 8l-1.42-1.41z"/>
            </svg>
          </button>
          <div className="absolute hidden group-hover:block bg-white shadow-lg rounded p-2 z-10 right-0">
            <div className="grid grid-cols-5 gap-1">
              {['#FFFF00', '#FFCC00', '#FF9900', '#FF6600', '#FF0000', '#FF99CC', '#FF66CC', '#CC00CC', '#9900FF', '#6600FF', '#0000FF', '#00CCFF', '#00FFFF', '#00CCCC', '#00CC99', '#00FF00'].map(color => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-gray-200"
                  style={{ backgroundColor: color }}
                  onClick={() => commands.setHighlight(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className={divider}></div>
      
      {/* Link */}
      <div className="flex items-center">
        <button 
          className={`w-8 h-8 rounded flex items-center justify-center ${isActive('link') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          onClick={handleLink}
          title="Insert Link (Ctrl+K)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        </button>
      </div>
      
      <div className={divider}></div>
      
      {/* Clear Formatting */}
      <div className="flex items-center">
        <button 
          className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100" 
          onClick={commands.clearFormatting}
          title="Clear Formatting (Ctrl+\)"
          disabled={!editor?.can().chain().focus().clearNodes().unsetAllMarks().run()}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}


