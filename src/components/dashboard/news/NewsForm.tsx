"use client";

import { useState, useRef } from "react";
import { createNewsAction, updateNewsAction } from "@/app/actions/news";
import { uploadFileAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Loader2, Save, ImageIcon, Send, Calendar as CalendarIcon,
    X, Upload, Trash2
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import { format } from "date-fns";

interface NewsFormProps {
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function NewsForm({ initialData, onSuccess, onCancel }: NewsFormProps) {
    const isEditing = !!initialData;
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        content: initialData?.content || "",
        image_url: initialData?.image_url || "",
        published_at: initialData?.published_at
            ? format(new Date(initialData.published_at), "yyyy-MM-dd'T'HH:mm")
            : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    });

    /* ── Image upload ── */
    const handleImageFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be under 10 MB");
            return;
        }
        setImageUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await uploadFileAction(fd);
            if (res.error) { toast.error(res.error); return; }
            setFormData(prev => ({ ...prev, image_url: res.url! }));
            toast.success("Banner image uploaded");
        } catch (e: any) {
            toast.error(e.message || "Upload failed");
        } finally {
            setImageUploading(false);
        }
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleImageFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageFile(file);
        e.target.value = "";
    };

    /* ── Submit ── */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.error("Title and content are required");
            return;
        }
        setLoading(true);
        try {
            const data = {
                ...formData,
                published_at: new Date(formData.published_at).toISOString(),
            };
            const res = isEditing
                ? await updateNewsAction(initialData.$id, data)
                : await createNewsAction(data);

            if (res.success) {
                toast.success(isEditing ? "Article updated" : "Article published");
                onSuccess();
            } else {
                toast.error(res.error || "Something went wrong");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-1">
                    <h2 className="text-xl font-black font-outfit uppercase tracking-tight text-slate-800">
                        {isEditing ? "Edit Article" : "Draft New Story"}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                        Design an impactful announcement for the community
                    </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-slate-100 h-10 w-10">
                    <X className="h-5 w-5 text-slate-400" />
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Main content ── */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Headline</label>
                        <Input
                            placeholder="Enter a compelling title..."
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="h-16 text-2xl font-black rounded-2xl border-2 focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Body Content</label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(content) => setFormData({ ...formData, content })}
                            placeholder="Tell your story here..."
                        />
                    </div>
                </div>

                {/* ── Sidebar ── */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="p-8 rounded-[2rem] bg-slate-50 border-2 border-slate-100 space-y-6">

                        {/* Banner Image */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Banner Image
                            </label>

                            {formData.image_url ? (
                                /* Preview with replace / remove */
                                <div className="relative group aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-slate-100">
                                    <img
                                        src={formData.image_url}
                                        alt="Banner preview"
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={imageUploading}
                                            className="h-9 px-4 rounded-xl bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            {imageUploading
                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                : <Upload className="w-3.5 h-3.5" />
                                            }
                                            Replace
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                                            className="h-9 w-9 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Drop zone */
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleFileDrop}
                                    className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${dragOver
                                            ? "border-primary bg-primary/5 scale-[1.02]"
                                            : "border-slate-200 bg-white hover:border-primary/50 hover:bg-primary/5"
                                        }`}
                                >
                                    {imageUploading ? (
                                        <>
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Uploading...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                <Upload className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div className="text-center px-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Click or drag to upload</p>
                                                <p className="text-[9px] text-slate-400 mt-0.5">JPG, PNG, WebP — max 10 MB</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileInput}
                            />
                        </div>

                        {/* Publication Date */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4" /> Publication Date
                            </label>
                            <Input
                                type="datetime-local"
                                value={formData.published_at}
                                onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                                className="h-12 rounded-xl bg-white border-slate-200 text-xs font-bold"
                            />
                        </div>

                        {/* Actions */}
                        <div className="pt-2 space-y-3">
                            <Button
                                type="submit"
                                disabled={loading || imageUploading}
                                className="w-full h-14 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                {loading
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : isEditing ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />
                                }
                                {isEditing ? "Update Article" : "Publish Now"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="w-full h-14 rounded-2xl border-2 border-slate-200 text-slate-500 font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-100 hover:text-slate-800"
                            >
                                Cancel Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
