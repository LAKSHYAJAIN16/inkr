"use client";

import { useState, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";

// Simple vertical divider
const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1"></div>;

const fontFamilies = [
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Times New Roman", value: "Times New Roman, serif" },
  { name: "Verdana", value: "Verdana, sans-serif" },
  { name: "Courier New", value: "Courier New, monospace" },
  { name: "Georgia", value: "Georgia, serif" },
];

const defaultColors = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
];

const blockTypes = [
  { label: "Normal Text", tag: "paragraph", fontSize: 14 },
  { label: "Title", tag: "title", fontSize: 48 },
  { label: "Subtitle", tag: "subtitle", fontSize: 24 },
  { label: "Heading 1", tag: "heading1", fontSize: 32 },
  { label: "Heading 2", tag: "heading2", fontSize: 28 },
  { label: "Heading 3", tag: "heading3", fontSize: 22 },
];

export default function Toolbar({ editor }: { editor: Editor | null }) {
  const [, forceUpdate] = useState(0);

  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showBlockDropdown, setShowBlockDropdown] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const [fontSizeInput, setFontSizeInput] = useState(14);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [imageURL, setImageURL] = useState("");

  const fontRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  // Sync toolbar with editor selection
  useEffect(() => {
    if (!editor) return;

    const updateToolbar = () => {
      const attrs = editor.getAttributes("textStyle");
      setFontSizeInput(attrs.fontSize ? parseInt(attrs.fontSize) : 14);
      forceUpdate(prev => prev + 1);
    };

    editor.on("selectionUpdate", updateToolbar);
    editor.on("transaction", updateToolbar);

    return () => {
      editor.off("selectionUpdate", updateToolbar);
      editor.off("transaction", updateToolbar);
    };
  }, [editor]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontRef.current && !fontRef.current.contains(event.target as Node)) setShowFontDropdown(false);
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) setShowColorDropdown(false);
      if (blockRef.current && !blockRef.current.contains(event.target as Node)) setShowBlockDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  const isActive = (name: string) => editor.isActive(name);
  const textStyleAttrs = editor.getAttributes("textStyle");
  const currentFont = textStyleAttrs.fontFamily || "Arial, sans-serif";
  const currentColor = textStyleAttrs.color || "#000000";

  // Font size handlers
  // Increment / decrement font size
  const incrementFontSize = () => {
    const newSize = Math.min(fontSizeInput + 1, 100);
    setFontSizeInput(newSize);
    editor.chain().focus().setMark("textStyle", { fontSize: `${newSize}px` }).run();
  };

  const decrementFontSize = () => {
    const newSize = Math.max(fontSizeInput - 1, 1);
    setFontSizeInput(newSize);
    editor.chain().focus().setMark("textStyle", { fontSize: `${newSize}px` }).run();
  };

  // Input change handler
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation(); // prevent editor from receiving typing
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 14;
    val = Math.min(Math.max(val, 1), 100);
    setFontSizeInput(val);
    editor.chain().focus().setMark("textStyle", { fontSize: `${val}px` }).run();
  };


  // Font color
  const setColor = (color: string) => {
    editor.chain().focus().setMark("textStyle", { color }).run();
  };

  // Image insertion
  const handleInsertImageURL = () => {
    if (!editor || !imageURL.trim()) return;
    editor.chain().focus().setImage({ src: imageURL }).run();
    setImageURL("");
    setShowImageModal(false);
  };
  const handleUploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    setShowImageModal(false);
  };

  // Link handlers
  const insertLink = () => {
    const previousUrl = editor.getAttributes("link").href || '';
    const url = prompt("Enter URL", previousUrl);
    if (url === null) return;
    if (url === '') editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  const removeLink = () => editor.chain().focus().unsetLink().run();

  // Block type
  const setBlock = (blockTag: string, fontSize: number) => {
    switch (blockTag) {
      case "paragraph":
      case "title":
      case "subtitle":
        editor.chain().focus().setParagraph().setMark("textStyle", { fontSize: fontSize + "px" }).run();
        break;
      case "heading1":
        editor.chain().focus().toggleHeading({ level: 1 }).setMark("textStyle", { fontSize: fontSize + "px" }).run();
        break;
      case "heading2":
        editor.chain().focus().toggleHeading({ level: 2 }).setMark("textStyle", { fontSize: fontSize + "px" }).run();
        break;
      case "heading3":
        editor.chain().focus().toggleHeading({ level: 3 }).setMark("textStyle", { fontSize: fontSize + "px" }).run();
        break;
    }
    setFontSizeInput(fontSize);
  };

  return (
    <div className="h-10 px-4 py-2 -mt-3 mx-4 my-3 bg-gray-100 rounded-3xl flex items-center gap-4 select-none">

      {/* Undo / Redo */}
      <div className="flex items-center space-x-1">
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-50">
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>undo</span>
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-50">
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>redo</span>
        </button>
      </div>

      <Divider />

      {/* Bold / Italic / Underline */}
      <div className="flex items-center space-x-0.5">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${isActive("bold") ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>format_bold</span>
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${isActive("italic") ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>format_italic</span>
        </button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${isActive("underline") ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>format_underlined</span>
        </button>
      </div>

      <Divider />

      {/* Links */}
      <div className="flex items-center space-x-1">
        <button onClick={insertLink} className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer hover:bg-gray-200 ${editor.isActive("link") ? "bg-gray-300" : ""}`}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>link</span>
        </button>
        {editor.isActive("link") && (
          <button onClick={removeLink} className="w-8 h-8 flex items-center justify-center rounded cursor-pointer hover:bg-gray-200">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>link_off</span>
          </button>
        )}
      </div>

      <Divider />

      {/* Block type dropdown */}
      <div className="relative" ref={blockRef}>
        <button onClick={() => setShowBlockDropdown(!showBlockDropdown)} className="h-8 px-2 text-sm bg-transparent hover:bg-gray-100 border border-gray-200 rounded flex items-center justify-between">
          <span>
            {blockTypes.find(b => {
              if (editor.isActive('heading', { level: 1 }) && b.tag === 'heading1') return true;
              if (editor.isActive('heading', { level: 2 }) && b.tag === 'heading2') return true;
              if (editor.isActive('heading', { level: 3 }) && b.tag === 'heading3') return true;
              if (editor.isActive('paragraph') && b.tag === 'paragraph') return true;
              return false;
            })?.label || 'Normal Text'}
          </span>
          <span className={`material-symbols-outlined text-gray-500 text-sm transition-transform ${showBlockDropdown ? "rotate-180" : ""}`}>expand_more</span>
        </button>

        {showBlockDropdown && (
          <div className="absolute z-10 top-full left-0 mt-1 w-48 bg-white shadow-lg rounded-md border border-gray-200 py-1 max-h-60 overflow-y-auto">
            {blockTypes.map(b => (
              <button key={b.tag} onClick={() => { setBlock(b.tag, b.fontSize); setShowBlockDropdown(false); }} className={`w-full text-left px-3 py-1 hover:bg-gray-50`} style={{ fontSize: `${b.fontSize}px` }}>
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Font family */}
      <div className="relative" ref={fontRef}>
        <button onClick={() => setShowFontDropdown(!showFontDropdown)} className="h-8 px-2 text-sm bg-transparent hover:bg-gray-100 border border-gray-200 rounded flex items-center justify-between">
          <span style={{ fontFamily: currentFont }}>{fontFamilies.find(f => f.value === currentFont)?.name || "Arial"}</span>
          <span className={`material-symbols-outlined text-gray-500 text-sm transition-transform ${showFontDropdown ? "rotate-180" : ""}`}>expand_more</span>
        </button>

        {showFontDropdown && (
          <div className="absolute z-10 top-full left-0 mt-1 w-48 bg-white shadow-lg rounded-md border border-gray-200 py-1 max-h-60 overflow-y-auto">
            {fontFamilies.map(f => (
              <button key={f.value} onClick={() => editor.chain().focus().setMark("textStyle", { fontFamily: f.value }).run()} className={`w-full text-left px-3 py-1 text-sm hover:bg-gray-50 ${currentFont === f.value ? "bg-blue-50 text-blue-600" : ""}`}>
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Font size */}
      <div className="flex items-center border border-gray-200 rounded-md overflow-hidden h-8">
        <button type="button" className="h-full w-7 flex items-center justify-center text-gray-500 hover:bg-gray-100" onClick={decrementFontSize}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>remove</span>
        </button>

        <input
          type="number"
          min={1}
          max={100}
          value={fontSizeInput}
          onChange={handleFontSizeChange}
          onFocus={(e) => e.stopPropagation()} // prevent editor focus
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-full text-center text-sm border-0 focus:ring-0 focus:outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        <button type="button" className="h-full w-7 flex items-center justify-center text-gray-500 hover:bg-gray-100" onClick={incrementFontSize}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
        </button>
      </div>

      <Divider />

      {/* Font color */}
      <div className="relative" ref={colorRef}>
        <button onClick={() => setShowColorDropdown(!showColorDropdown)} className="h-8 w-8 rounded border border-gray-200 flex items-center justify-center" style={{ color: currentColor }}>
          A
        </button>
        {showColorDropdown && (
          <div className="absolute z-10 top-full left-0 mt-1 w-52 bg-white shadow-lg rounded-md border border-gray-200 py-2 px-2 grid grid-cols-5 gap-1">
            {[...defaultColors, ...customColors].map(color => (
              <div key={color} onClick={() => setColor(color)} className="w-6 h-6 rounded cursor-pointer" style={{ backgroundColor: color }} />
            ))}
            <button onClick={() => {
              const newColor = prompt("Enter color hex code", "#000000");
              if (newColor) setCustomColors([...customColors, newColor]);
            }} className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded cursor-pointer">+</button>
          </div>
        )}
      </div>

      <Divider />

      {/* Image dropdown with icons */}
      <div className="relative">
        <button
          onClick={() => setShowImageModal(!showImageModal)}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            image
          </span>
        </button>

        {showImageModal && (
          <div className="absolute z-10 top-full mt-1 w-40 bg-white shadow-lg rounded-md border border-gray-200 py-1">

            {/* Upload Button */}
            <label className="flex items-center gap-2 px-3 py-1 text-sm cursor-pointer hover:bg-gray-50">
              <span className="material-symbols-outlined">upload_file</span>
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                className="hidden"
              />
            </label>

            {/* Insert via URL */}
            <button
              onClick={() => {
                const url = prompt("Enter image URL");
                if (url) handleInsertImageURL();
                setShowImageModal(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-1 text-sm cursor-pointer hover:bg-gray-50"
            >
              <span className="material-symbols-outlined">link</span>
              Insert via URL
            </button>
          </div>
        )}
      </div>



    </div>
  );
}
