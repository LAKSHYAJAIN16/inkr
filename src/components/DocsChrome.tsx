"use client";
import React from "react";
import { useEditorCommands, EditorCommandsRegistrarProvider } from "./EditorContext";

export function DocsChrome({ title, children }: { title: string; children: React.ReactNode }) {
  const [commands, setCommands] = React.useState(useEditorCommands());
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <TopBar title={title} />
      <MenuBar />
      <EditorCommandsRegistrarProvider register={setCommands}>
        <ToolbarBar commands={commands} />
        <Ruler />
        <div className="flex-1 overflow-auto">
          <div className="py-8 flex justify-center">
            <div className="bg-white shadow-md w-[816px] min-h-[1056px] border border-gray-200">
              {children}
            </div>
          </div>
        </div>
      </EditorCommandsRegistrarProvider>
    </div>
  );
}

function TopBar({ title }: { title: string }) {
  return (
    <div className="h-12 px-3 flex items-center gap-3 bg-white border-b">
      <span className="material-symbols-outlined text-[#1a73e8]">description</span>
      <div className="text-[15px] text-gray-800 font-medium truncate max-w-[40%]">{title}</div>
      <div className="ml-auto flex items-center gap-3 text-gray-600">
        <button className="h-8 px-4 rounded-full bg-[#1a73e8] text-white text-sm">Share</button>
        <span className="material-symbols-outlined">account_circle</span>
      </div>
    </div>
  );
}

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

function ToolbarBar({ commands }: { commands: ReturnType<typeof useEditorCommands> }) {
  const btn = "h-8 px-2 rounded text-[13px] text-gray-800 hover:bg-gray-200";
  const cmds = commands;
  return (
    <div className="h-10 bg-white border-b flex items-center px-2 gap-1">
      <button className={btn} onClick={cmds.undo}><span className="material-symbols-outlined text-[18px]">undo</span></button>
      <button className={btn} onClick={cmds.redo}><span className="material-symbols-outlined text-[18px]">redo</span></button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button className={btn}><span className="material-symbols-outlined">search</span></button>
      <div className="ml-2 h-8 flex items-center rounded border px-2 text-[13px] text-gray-700">100%</div>
      <div className="ml-2 h-8 flex items-center rounded border px-2 text-[13px] text-gray-700">Normal text</div>
      <div className="ml-2 h-8 flex items-center rounded border px-2 text-[13px] text-gray-700">Arial</div>
      <div className="ml-1 h-8 flex items-center rounded border px-2 text-[13px] text-gray-700">11</div>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button className={btn + " font-semibold"} onClick={cmds.toggleBold}>B</button>
      <button className={btn + " italic"} onClick={cmds.toggleItalic}>I</button>
      <button className={btn + " underline"} onClick={cmds.toggleUnderline}>U</button>
      <button className={btn}><span className="material-symbols-outlined">format_ink_highlighter</span></button>
      <button className={btn}><span className="material-symbols-outlined">format_color_text</span></button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button className={btn} onClick={() => cmds.align("left")}><span className="material-symbols-outlined">format_align_left</span></button>
      <button className={btn} onClick={() => cmds.align("center")}><span className="material-symbols-outlined">format_align_center</span></button>
      <button className={btn} onClick={() => cmds.align("right")}><span className="material-symbols-outlined">format_align_right</span></button>
      <button className={btn} onClick={() => cmds.align("justify")}><span className="material-symbols-outlined">format_align_justify</span></button>
      <button className={btn}><span className="material-symbols-outlined">format_line_spacing</span></button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button className={btn} onClick={cmds.toggleBulletList}><span className="material-symbols-outlined">format_list_bulleted</span></button>
      <button className={btn} onClick={cmds.toggleOrderedList}><span className="material-symbols-outlined">format_list_numbered</span></button>
      <div className="ml-auto flex items-center gap-2 pr-2">
        <button className={btn}><span className="material-symbols-outlined">mode_comment</span></button>
      </div>
    </div>
  );
}

function Ruler() {
  return (
    <div className="h-6 bg-white border-b flex items-center px-6 text-[10px] text-gray-500 select-none">
      <div className="w-[816px] mx-auto flex">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex-1 relative">
            <span className="absolute -top-1 left-1/2 -translate-x-1/2">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


