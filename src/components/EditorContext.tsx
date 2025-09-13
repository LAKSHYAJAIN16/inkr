"use client";
import React, { createContext, useContext } from "react";

export type EditorCommands = {
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

const noop = () => {};

const Ctx = createContext<EditorCommands>({
  undo: noop,
  redo: noop,
  toggleBold: noop,
  toggleItalic: noop,
  toggleUnderline: noop,
  toggleStrike: noop,
  toggleBulletList: noop,
  toggleOrderedList: noop,
  setHeading: () => {},
  setParagraph: noop,
  setTextAlign: () => {},
  setFontFamily: () => {},
  setFontSize: () => {},
  setColor: () => {},
  setHighlight: () => {},
  toggleLink: () => {},
  clearFormatting: noop,
  align: () => {},
});

export function useEditorCommands() {
  return useContext(Ctx);
}

export function EditorCommandsProvider({ value, children }: { value: EditorCommands; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Registrar to allow child editors to register their commands with a parent toolbar
type Register = (value: EditorCommands) => void;
const RegisterCtx = createContext<Register>(() => {});
export function useRegisterCommands() {
  return useContext(RegisterCtx);
}
export function EditorCommandsRegistrarProvider({ register, children }: { register: Register; children: React.ReactNode }) {
  return <RegisterCtx.Provider value={register}>{children}</RegisterCtx.Provider>;
}


