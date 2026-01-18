"use client";

import { useState, useEffect } from "react";
import { Search as SearchIcon, ChevronRight, ChevronDown, FileCode, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAPI } from "@/lib/api";
import { toast } from "@/components/ui/Toaster";

interface SearchResult {
    file: string;
    line: number;
    content: string;
}

interface SearchProps {
    projectId: string;
    onResultClick: (path: string, line: number) => void;
}

export function Search({ projectId, onResultClick }: SearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim()) {
                performSearch();
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const data = await fetchAPI(`/files/search.php?project_id=${projectId}&query=${encodeURIComponent(query)}`);
            setResults(data.results || []);
            setExpandedFiles(new Set(data.results.map((r: SearchResult) => r.file)));
        } catch (error: any) {
            // Squelch error on empty or rapid queries, or show toast
            // toast.error(error.message || "Search failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Triggered by effect now, but we can force it if needed
    };

    const toggleFile = (file: string) => {
        const newExpanded = new Set(expandedFiles);
        if (newExpanded.has(file)) {
            newExpanded.delete(file);
        } else {
            newExpanded.add(file);
        }
        setExpandedFiles(newExpanded);
    };

    // Group results by file
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.file]) {
            acc[result.file] = [];
        }
        acc[result.file].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
            <div className="flex items-center px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#bbbbbb]">
                <span>Search</span>
            </div>

            <div className="p-4 border-b border-[#3c3c3c]">
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search"
                        className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#007acc] pr-8"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1.5 text-[#858585] hover:text-white"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                    </button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto">
                {results.length === 0 && !loading && query && (
                    <div className="p-4 text-xs text-[#858585] text-center">
                        No results found.
                    </div>
                )}

                {Object.entries(groupedResults).map(([file, fileResults]) => (
                    <div key={file} className="flex flex-col">
                        <div
                            className="flex items-center gap-1 py-1 px-2 hover:bg-[#2a2d2e] cursor-pointer"
                            onClick={() => toggleFile(file)}
                        >
                            {expandedFiles.has(file) ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                            <FileCode className="h-4 w-4 text-[#858585]" />
                            <span className="text-sm font-semibold truncate" title={file}>{file.split('/').pop()}</span>
                            <span className="text-xs text-[#6e6e6e] ml-2">{fileResults.length}</span>
                        </div>

                        {expandedFiles.has(file) && (
                            <div className="flex flex-col">
                                {fileResults.map((result, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 py-1 pl-8 pr-2 hover:bg-[#37373d] cursor-pointer text-xs font-mono group"
                                        onClick={() => onResultClick(result.file, result.line)}
                                    >
                                        <span className="text-[#858585] w-6 text-right shrink-0">{result.line}:</span>
                                        <span className="truncate text-[#cccccc] group-hover:text-white">{result.content}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
