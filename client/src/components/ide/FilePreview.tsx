"use client";

import { useEffect, useState } from "react";
import { Loader2, FileText, ImageIcon, Layout } from "lucide-react";

interface FilePreviewProps {
    projectId: string;
    path: string;
    content: string;
    type: "markdown" | "image" | "html" | "code" | "other";
}

export function FilePreview({ projectId, path, content, type }: FilePreviewProps) {
    const rawUrl = `/api/files/raw.php?project_id=${projectId}&path=${path}`;

    if (type === "image") {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[#252526] p-8 overflow-auto">
                <div className="relative group">
                    <img
                        src={rawUrl}
                        alt={path}
                        className="max-w-full max-h-full shadow-2xl rounded border border-[#333] transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none rounded">
                        <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-mono">{path}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (type === "html") {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="flex items-center justify-between px-4 py-1 bg-[#f3f3f3] border-b text-[11px] text-[#666]">
                    <span>Previewing: {path}</span>
                    <a href={rawUrl} target="_blank" className="hover:text-primary underline">Open in New Tab</a>
                </div>
                <iframe
                    src={rawUrl}
                    className="flex-1 w-full border-none"
                    title="HTML Preview"
                />
            </div>
        );
    }

    if (type === "markdown") {
        // Simple markdown rendering logic or use a lib if we had one
        // For now, let's just make it look good as text or use a simple parser
        return (
            <div className="h-full overflow-y-auto bg-white text-black p-8 md:p-12 prose prose-sm max-w-none">
                <div className="mb-4 pb-2 border-b text-xs text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Markdown Preview
                </div>
                <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{
                        __html: parseMarkdown(content)
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full items-center justify-center text-muted-foreground italic flex-col gap-2">
            <Layout className="h-10 w-10 opacity-20" />
            No preview available for this file type.
        </div>
    );
}

// Minimal markdown parser for "cool" factors without external libs
function parseMarkdown(md: string) {
    let html = md
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4 mt-6 border-b pb-2">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-3 mt-5 border-b pb-1">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium mb-2 mt-4">$1</h3>')
        .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 py-1 italic my-4 bg-gray-50">$1</blockquote>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" class="max-w-full h-auto my-4 rounded shadow-sm" />')
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
        .replace(/`(.*?)`/gim, '<code class="bg-gray-100 px-1 rounded font-mono text-sm">$1</code>')
        .replace(/\n\n/gim, '<p class="mb-4"></p>')
        .replace(/\n\*\s(.*)/gim, '<ul class="list-disc ml-6 mb-4"><li>$1</li></ul>')
        .replace(/<\/ul>\s*<ul.*?>/gim, ''); // Merge consecutive lists

    return html;
}
