"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
    Bold, Italic, Underline as UnderlineIcon,
    List, ListOrdered, Quote, Undo, Redo,
    Heading1, Heading2, Link as LinkIcon,
    Strikethrough, Code, AlignLeft, AlignCenter, AlignRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const ToolbarButton = ({
    isActive,
    onClick,
    children,
    icon: Icon
}: {
    isActive?: boolean;
    onClick: () => void;
    children?: React.ReactNode;
    icon?: any;
}) => (
    <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={cn(
            "h-8 w-8 p-0 rounded-md transition-all duration-200 hover:bg-white hover:text-indigo-600",
            isActive ? "bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200" : "text-slate-500"
        )}
    >
        {Icon ? <Icon className="h-4 w-4" /> : children}
    </Button>
);

const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepAttributes: true,
                    keepMarks: true,
                    HTMLAttributes: {
                        class: "list-disc ml-4 space-y-1",
                    },
                },
                orderedList: {
                    keepAttributes: true,
                    keepMarks: true,
                    HTMLAttributes: {
                        class: "list-decimal ml-4 space-y-1",
                    },
                },
                heading: {
                    HTMLAttributes: {
                        class: "font-black tracking-tight",
                    },
                },
                blockquote: {
                    HTMLAttributes: {
                        class: "border-l-4 border-indigo-200 pl-4 italic text-slate-600",
                    },
                },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-indigo-600 underline cursor-pointer",
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || "Start typing awesome rules...",
            }),
        ],
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: cn(
                    "min-h-[200px] w-full focus:outline-none p-6 text-sm leading-relaxed text-slate-700",
                    className
                ),
            },
        },
    });

    // Update editor content if value changes externally (but not from update event)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="group rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100/50 focus-within:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-slate-50/80 border-b border-slate-100 backdrop-blur-sm">
                <div className="flex items-center gap-0.5 pr-1.5 mr-1.5 border-r border-slate-200">
                    <ToolbarButton
                        icon={Bold}
                        isActive={editor.isActive("bold")}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    />
                    <ToolbarButton
                        icon={Italic}
                        isActive={editor.isActive("italic")}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    />
                    <ToolbarButton
                        icon={UnderlineIcon}
                        isActive={editor.isActive("underline")}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    />
                    <ToolbarButton
                        icon={Strikethrough}
                        isActive={editor.isActive("strike")}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                    />
                </div>

                <div className="flex items-center gap-0.5 pr-1.5 mr-1.5 border-r border-slate-200">
                    <ToolbarButton
                        icon={Heading1}
                        isActive={editor.isActive("heading", { level: 1 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    />
                    <ToolbarButton
                        icon={Heading2}
                        isActive={editor.isActive("heading", { level: 2 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    />
                </div>

                <div className="flex items-center gap-0.5 pr-1.5 mr-1.5 border-r border-slate-200">
                    <ToolbarButton
                        icon={List}
                        isActive={editor.isActive("bulletList")}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    />
                    <ToolbarButton
                        icon={ListOrdered}
                        isActive={editor.isActive("orderedList")}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    />
                </div>

                <div className="flex items-center gap-0.5 pr-1.5 mr-1.5 border-r border-slate-200">
                    <ToolbarButton
                        icon={Quote}
                        isActive={editor.isActive("blockquote")}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    />
                    <ToolbarButton
                        icon={Code}
                        isActive={editor.isActive("code")}
                        onClick={() => editor.chain().focus().toggleCode().run()}
                    />
                </div>

                <div className="flex items-center gap-0.5 ml-auto">
                    <ToolbarButton
                        icon={Undo}
                        onClick={() => editor.chain().focus().undo().run()}
                    />
                    <ToolbarButton
                        icon={Redo}
                        onClick={() => editor.chain().focus().redo().run()}
                    />
                </div>
            </div>

            {/* Editor Content Area with visible scrollbar */}
            <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-50 scrollbar-track-transparent">
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
                .tiptap p.is-editor-empty:first-child::before {
                    color: #94a3b8;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .tiptap ul { list-style-type: disc; padding-left: 1.5rem; margin: 1rem 0; }
                .tiptap ol { list-style-type: decimal; padding-left: 1.5rem; margin: 1rem 0; }
                .tiptap blockquote { border-left: 4px solid #e0e7ff; padding-left: 1rem; font-style: italic; margin: 1rem 0; color: #475569; }
                .tiptap h1 { font-size: 1.5rem; font-weight: 900; margin: 1.5rem 0 1rem 0; color: #0f172a; }
                .tiptap h2 { font-size: 1.25rem; font-weight: 800; margin: 1.25rem 0 0.75rem 0; color: #1e293b; }
                .tiptap code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.9em; }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
