"use client";

import { X, FileCode, FileJson, File, FileType } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorTabsProps {
    files: string[];
    activeFile: string | null;
    onSelect: (file: string) => void;
    onClose: (file: string) => void;
    unsavedFiles?: string[];
}

export function EditorTabs({ files, activeFile, onSelect, onClose, unsavedFiles = [] }: EditorTabsProps) {

    const getIcon = (filename: string) => {
        if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return <FileCode className="h-4 w-4 text-blue-400" />;
        if (filename.endsWith('.css')) return <FileCode className="h-4 w-4 text-blue-300" />;
        if (filename.endsWith('.json')) return <FileJson className="h-4 w-4 text-yellow-400" />;
        return <File className="h-4 w-4 text-gray-400" />;
    }

    return (
        <div className="flex h-9 w-full bg-[#18181b] overflow-x-auto no-scrollbar">
            {files.map((file) => (
                <div
                    key={file}
                    className={cn(
                        "group flex min-w-[120px] max-w-[200px] cursor-pointer items-center gap-2 border-r border-[#2b2b2b] px-3 text-xs",
                        activeFile === file
                            ? "bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]"
                            : "bg-[#212126] text-[#969696] hover:bg-[#2b2b2b]"
                    )}
                    onClick={() => onSelect(file)}
                >
                    {getIcon(file)}
                    <span className="flex-1 truncate">{file.split('/').pop()}</span>
                    <div className="flex items-center">
                        {unsavedFiles.includes(file) && (
                            <div className="h-2 w-2 rounded-full bg-white group-hover:hidden" />
                        )}
                        <X
                            className={cn(
                                "h-4 w-4 rounded-md p-0.5 hover:bg-[#4b4b4b]",
                                unsavedFiles.includes(file) ? "hidden group-hover:block" : "invisible group-hover:visible"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose(file);
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
