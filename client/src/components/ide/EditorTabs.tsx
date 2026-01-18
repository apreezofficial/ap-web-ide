import { X, FileCode, FileJson, File, FileType } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

interface EditorTabsProps {
    files: string[];
    activeFile: string | null;
    onSelect: (file: string) => void;
    onClose: (file: string) => void;
    unsavedFiles?: string[];
}

export function EditorTabs({ files, activeFile, onSelect, onClose, unsavedFiles = [] }: EditorTabsProps) {

    const getIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        const iconProps = { className: "h-4 w-4" };

        switch (ext) {
            case 'ts':
            case 'tsx':
                return <Icons.ts {...iconProps} className="h-4 w-4 text-[#3178c6]" />;
            case 'js':
            case 'jsx':
                return <Icons.js {...iconProps} className="h-4 w-4 text-[#f1e05a]" />;
            case 'php':
                return <Icons.php {...iconProps} className="h-4 w-4 text-[#777bb4]" />;
            case 'css':
                return <Icons.css {...iconProps} className="h-4 w-4 text-[#563d7c]" />;
            case 'json':
                return <Icons.json {...iconProps} className="h-4 w-4 text-[#cbcb41]" />;
            case 'md':
                return <Icons.md {...iconProps} className="h-4 w-4 text-[#083fa1]" />;
            case 'html':
                return <Icons.html {...iconProps} className="h-4 w-4 text-[#e34c26]" />;
            case 'py':
                return <Icons.python {...iconProps} className="h-4 w-4 text-[#3572a5]" />;
            case 'go':
                return <Icons.go {...iconProps} className="h-4 w-4 text-[#00add8]" />;
            case 'rb':
                return <Icons.ruby {...iconProps} className="h-4 w-4 text-[#701516]" />;
            default:
                return <File className="h-4 w-4 text-[#858585]" />;
        }
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
