"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, List, ListOrdered, Quote, Undo, Redo,
    Link as LinkIcon, Image as ImageIcon, Underline as UnderlineIcon,
    Heading1, Heading2, Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const addLink = () => {
        const url = window.prompt('URL');
        if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    const addImage = () => {
        const url = window.prompt('Image URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 rounded-t-2xl">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn("h-8 w-8", editor.isActive('bold') && "bg-slate-200 text-primary")}
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn("h-8 w-8", editor.isActive('italic') && "bg-slate-200 text-primary")}
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn("h-8 w-8", editor.isActive('underline') && "bg-slate-200 text-primary")}
            >
                <UnderlineIcon className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-6 bg-slate-200 mx-1 self-center" />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn("h-8 w-8", editor.isActive('heading', { level: 1 }) && "bg-slate-200 text-primary")}
            >
                <Heading1 className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn("h-8 w-8", editor.isActive('heading', { level: 2 }) && "bg-slate-200 text-primary")}
            >
                <Heading2 className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-6 bg-slate-200 mx-1 self-center" />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn("h-8 w-8", editor.isActive('bulletList') && "bg-slate-200 text-primary")}
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn("h-8 w-8", editor.isActive('orderedList') && "bg-slate-200 text-primary")}
            >
                <ListOrdered className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-6 bg-slate-200 mx-1 self-center" />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn("h-8 w-8", editor.isActive('blockquote') && "bg-slate-200 text-primary")}
            >
                <Quote className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={cn("h-8 w-8", editor.isActive('codeBlock') && "bg-slate-200 text-primary")}
            >
                <Code className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-6 bg-slate-200 mx-1 self-center" />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={addLink}
                className={cn("h-8 w-8", editor.isActive('link') && "bg-slate-200 text-primary")}
            >
                <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={addImage}
                className="h-8 w-8"
            >
                <ImageIcon className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().undo().run()}
                className="h-8 w-8"
            >
                <Undo className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().redo().run()}
                className="h-8 w-8"
            >
                <Redo className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-xl max-w-full h-auto border-2 border-slate-100 my-4',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Write something amazing...',
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none min-h-[300px] p-6 focus:outline-none focus:ring-0 text-slate-700 font-medium leading-relaxed',
            },
        },
    });

    return (
        <div className="w-full border-2 border-slate-100 rounded-2xl bg-white focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all overflow-hidden group">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
            <style jsx global>{`
                .tiptap p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #94a3b8;
                    pointer-events: none;
                    height: 0;
                }
                .tiptap:focus {
                    outline: none;
                }
                .tiptap blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1rem;
                    font-style: italic;
                    color: #64748b;
                    background: #f8fafc;
                    padding-top: 0.5rem;
                    padding-bottom: 0.5rem;
                    margin: 1rem 0;
                }
                .tiptap code {
                    background: #f1f5f9;
                    color: #0f172a;
                    padding: 0.2rem 0.4rem;
                    border-radius: 0.3rem;
                    font-size: 0.9em;
                }
            `}</style>
        </div>
    );
}
