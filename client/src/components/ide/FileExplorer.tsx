"use client";

import { useState, useEffect } from "react";
import { Folder, File, ChevronRight, ChevronDown, MoreHorizontal, FileCode, FileJson, FileType } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAPI } from "@/lib/api";

interface FileSystemItem {
    name: string;
    path: string;
    type: "file" | "directory";
}

interface FileExplorerProps {
    projectId: number;
    onFileSelect: (path: string) => void;
    activeFile: string | null;
}

export function FileExplorer({ projectId, onFileSelect, activeFile }: FileExplorerProps) {
    const [items, setItems] = useState<FileSystemItem[]>([]);
    const [currentPath, setCurrentPath] = useState("");
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadFiles(currentPath);
    }, [currentPath, projectId]);

    const loadFiles = async (path: string) => {
        try {
            const data = await fetchAPI(`/files/list.php?project_id=${projectId}&path=${path}`);
            setItems(data.files || []);
        } catch (error) {
            console.error("Failed to load files", error);
        }
    };

    const handleItemClick = (item: FileSystemItem) => {
        if (item.type === "directory") {
            // For simplicity in this version, we just dive into directory
            // A full recursive tree view would be better but requires more complex state
            setCurrentPath(item.path);
        } else {
            onFileSelect(item.path);
        }
    };

    const handleUpLevel = () => {
        if (!currentPath) return;
        const parts = currentPath.split("/");
        parts.pop();
        setCurrentPath(parts.join("/"));
    };

    const getFileIcon = (filename: string) => {
        if (filename.endsWith('.php')) return <FileCode className="h-4 w-4 text-[#8893be]" />;
        if (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.tsx')) return <FileCode className="h-4 w-4 text-[#f1e05a]" />;
        if (filename.endsWith('.css')) return <FileCode className="h-4 w-4 text-[#563d7c]" />;
        if (filename.endsWith('.json')) return <FileJson className="h-4 w-4 text-[#f1e05a]" />;
        return <File className="h-4 w-4 text-[#cccccc]" />;
    };

    return (
        <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
            <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#bbbbbb] hover:bg-[#2a2d2e] cursor-pointer">
                <span>Explorer</span>
                <MoreHorizontal className="h-4 w-4" />
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Project Root Header */}
                <div className="flex items-center py-1 px-2 text-sm font-bold text-white hover:bg-[#2a2d2e] cursor-pointer">
                    <ChevronDown className="mr-1 h-4 w-4" />
                    <span className="truncate">PROJECT-{projectId}</span>
                </div>

                <div className="px-0">
                    {currentPath && (
                        <div
                            className="flex items-center gap-1.5 py-1 px-4 cursor-pointer text-sm hover:bg-[#2a2d2e] text-[#cccccc]"
                            onClick={handleUpLevel}
                        >
                            <ChevronDown className="h-4 w-4" />
                            <span>..</span>
                        </div>
                    )}

                    {items.map((item) => (
                        <div
                            key={item.path}
                            className={cn(
                                "flex items-center gap-1.5 py-1 px-4 cursor-pointer text-sm border-l-2 border-transparent hover:bg-[#2a2d2e]",
                                activeFile === item.path ? "bg-[#37373d] text-white border-[#007acc]" : "text-[#cccccc]"
                            )}
                            onClick={() => handleItemClick(item)}
                            style={{ paddingLeft: '24px' }} // Basic indentation
                        >
                            {item.type === "directory" ? (
                                <Folder className="h-4 w-4 text-[#dcb67a]" />
                            ) : (
                                getFileIcon(item.name)
                            )}
                            <span className="truncate">{item.name}</span>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="px-6 py-2 text-xs text-[#6e6e6e] italic">Empty folder</div>
                    )}
                </div>
            </div>
        </div>
    );
}
