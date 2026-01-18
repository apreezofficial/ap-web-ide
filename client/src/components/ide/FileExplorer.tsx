"use client";

import { useState, useEffect } from "react";
import { Folder, File, ChevronRight, ChevronDown, MoreHorizontal, FileCode, FileJson, FileType, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAPI } from "@/lib/api";
import { Icons } from "@/lib/icons";
import { toast } from "@/components/ui/Toaster";

interface FileSystemItem {
    name: string;
    path: string;
    type: "file" | "directory";
}

interface FileExplorerProps {
    projectId: string; // Changed to string (UUID)
    onFileSelect: (path: string) => void;
    activeFile: string | null;
}

export function FileExplorer({ projectId, onFileSelect, activeFile }: FileExplorerProps) {
    const [items, setItems] = useState<FileSystemItem[]>([]);
    const [currentPath, setCurrentPath] = useState("");
    const [loading, setLoading] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadFiles(currentPath);
    }, [currentPath, projectId]);

    const loadFiles = async (path: string) => {
        setLoading(true);
        try {
            const data = await fetchAPI(`/files/list.php?project_id=${projectId}&path=${path}`);
            setItems(data.files || []);
        } catch (error) {
            console.error("Failed to load files", error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = (item: FileSystemItem) => {
        if (item.type === "directory") {
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
        const ext = filename.split('.').pop()?.toLowerCase();
        const iconProps = { className: "h-4 w-4" };

        switch (ext) {
            case 'ts':
            case 'tsx':
                return <Icons.ts {...iconProps} className="text-[#3178c6]" />;
            case 'js':
            case 'jsx':
                return <Icons.js {...iconProps} className="text-[#f1e05a]" />;
            case 'php':
                return <Icons.php {...iconProps} className="text-[#777bb4]" />;
            case 'css':
                return <Icons.css {...iconProps} className="text-[#563d7c]" />;
            case 'json':
                return <Icons.json {...iconProps} className="text-[#cbcb41]" />;
            case 'py':
                return <Icons.python {...iconProps} className="text-[#3572a5]" />;
            case 'go':
                return <Icons.go {...iconProps} className="text-[#00add8]" />;
            case 'rb':
                return <Icons.ruby {...iconProps} className="text-[#701516]" />;
            case 'md':
                return <Icons.md {...iconProps} className="text-[#083fa1]" />;
            case 'html':
                return <Icons.html {...iconProps} className="text-[#e34c26]" />;
            default:
                return <File className="h-4 w-4 text-[#858585]" />;
        }
    };

    const handleCreate = async (type: "file" | "directory") => {
        const name = prompt(`Enter ${type} name:`);
        if (!name) return;

        toast.loading(`Creating ${type}...`);
        const path = currentPath ? `${currentPath}/${name}` : name;
        try {
            const res = await fetchAPI("/files/create.php", {
                method: "POST",
                body: JSON.stringify({
                    project_id: projectId,
                    path,
                    type,
                }),
            });
            if (res.success) {
                toast.success(`${type === 'file' ? 'File' : 'Folder'} created fr fr!`);
                loadFiles(currentPath);
                if (type === 'file') {
                    onFileSelect(path);
                }
            }
        } catch (error: any) {
            toast.error(error.message || `Failed to create ${type}`);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
            <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#bbbbbb] hover:bg-[#2a2d2e] group">
                <span>Explorer</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => handleCreate("file")}
                        className="p-1 hover:bg-[#37373d] rounded"
                        title="New File"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleCreate("directory")}
                        className="p-1 hover:bg-[#37373d] rounded"
                        title="New Folder"
                    >
                        <Folder className="h-4 w-4" />
                    </button>
                    <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Project Root Header */}
                <div
                    className="flex items-center py-1 px-2 text-sm font-bold text-white hover:bg-[#2a2d2e] cursor-pointer"
                    onClick={() => setCurrentPath("")}
                >
                    <ChevronDown className="mr-1 h-4 w-4" />
                    <span className="truncate">Files</span>
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

                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2 py-1 px-4 animate-pulse">
                                <div className="h-4 w-4 bg-muted/20 rounded" />
                                <div className="h-4 flex-1 bg-muted/20 rounded" />
                            </div>
                        ))
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
