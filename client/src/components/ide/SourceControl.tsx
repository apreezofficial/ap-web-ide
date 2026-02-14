"use client";

import { useState, useEffect } from "react";
import {
    GitBranch,
    Check,
    RefreshCw,
    Plus,
    Github,
    FileCode,
    AlertCircle,
    Loader2,
    ArrowUp,
    ArrowDown,
    Calendar,
    ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/Toaster";

interface GitChange {
    file: string;
    status: string;
}

interface SourceControlProps {
    projectId: string;
}

export function SourceControl({ projectId }: SourceControlProps) {
    const [changes, setChanges] = useState<GitChange[]>([]);
    const [branch, setBranch] = useState("");
    const [isGit, setIsGit] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [commitMessage, setCommitMessage] = useState("");
    const [committing, setCommitting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<{ ahead: number; behind: number } | null>(null);

    const [commitDate, setCommitDate] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);

    const loadStatus = async () => {
        setLoading(true);
        try {
            const data = await fetchAPI(`/github/status.php?project_id=${projectId}`);
            setIsGit(data.is_git);
            setChanges(data.changes || []);
            setBranch(data.branch || "");
        } catch (error) {
            console.error("Failed to load git status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, [projectId]);

    const handleCommit = async () => {
        if (!commitMessage.trim()) {
            toast.error("Please enter a commit message");
            return;
        }

        setCommitting(true);
        try {
            const payload: any = {
                project_id: projectId,
                message: commitMessage
            };

            // Add date if specified (for backdating)
            if (commitDate) {
                payload.date = commitDate;
            }

            const res = await fetchAPI("/github/commit.php", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            if (res.success) {
                toast.success(res.message || "Changes committed!");
                setCommitMessage("");
                setCommitDate("");
                loadStatus();
            }
        } catch (error: any) {
            toast.error(error.message || "Commit failed");
        } finally {
            setCommitting(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        toast.loading("Syncing with GitHub...");
        try {
            const res = await fetchAPI("/github/push.php", {
                method: "POST",
                body: JSON.stringify({ project_id: projectId })
            });
            if (res.success) {
                toast.success("Synced with GitHub successfully!");
                loadStatus();
            }
        } catch (error: any) {
            toast.error(error.message || "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const handlePublish = async () => {
        const name = prompt("Enter repository name for GitHub:");
        if (!name) return;

        const isPrivate = confirm("Do you want this repository to be Private?\n\nClick OK for Private.\nClick Cancel for Public.");

        setPublishing(true);
        toast.loading("Publishing to GitHub...");
        try {
            const res = await fetchAPI("/github/publish.php", {
                method: "POST",
                body: JSON.stringify({
                    project_id: projectId,
                    name: name,
                    private: isPrivate
                })
            });
            if (res.success) {
                toast.success("Published to GitHub successfully!");
                loadStatus();
            }
        } catch (error: any) {
            toast.error(error.message || "Publishing failed");
        } finally {
            setPublishing(false);
        }
    };

    const getStatusInfo = (status: string) => {
        const s = status.trim();
        if (s === 'M') return { label: 'M', color: 'text-amber-500', title: 'Modified' };
        if (s === 'A' || s === '??') return { label: 'A', color: 'text-green-500', title: 'Added' };
        if (s === 'D') return { label: 'D', color: 'text-red-500', title: 'Deleted' };
        return { label: s, color: 'text-gray-400', title: 'Unknown' };
    };

    if (loading && !branch) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#858585]" />
            </div>
        );
    }

    if (isGit === false) {
        return (
            <div className="flex flex-col h-full bg-[#252526] text-[#cccccc] p-4 gap-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#bbbbbb]">Source Control</div>
                <div className="flex flex-col gap-2 bg-[#2a2d2e] p-4 rounded border border-[#3e3e42]">
                    <AlertCircle className="h-8 w-8 text-[#dcb67a] mb-2" />
                    <p className="text-sm">This project is not yet initialized with Git.</p>
                    <p className="text-xs text-[#858585]">Initialize a repository to track changes and publish to GitHub.</p>
                </div>
                <Button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full bg-[#007acc] hover:bg-[#0062a3] text-white"
                >
                    {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Github className="h-4 w-4 mr-2" />}
                    Publish to GitHub
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
            <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#bbbbbb]">
                <span>Source Control</span>
                <div className="flex items-center gap-2">
                    <button onClick={loadStatus} className="hover:text-white" title="Refresh">
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </button>
                    <button onClick={handleSync} className="hover:text-white" title="Sync Changes">
                        <ArrowUp className="h-3 w-3" />
                        <ArrowDown className="h-3 w-3 -ml-1" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 p-4">
                {/* Branch Indicator */}
                <div className="flex items-center text-xs font-medium text-[#858585] gap-1.5">
                    <GitBranch className="h-3.5 w-3.5" />
                    <span>{branch}</span>
                    <span className="ml-auto bg-[#313132] px-1.5 py-0.5 rounded text-[10px]">main</span>
                </div>

                {/* Commit Input */}
                <div className="flex flex-col gap-2">
                    <textarea
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Message (Ctrl+Enter to commit)"
                        className="w-full h-20 bg-[#3c3c3c] border border-[#3e3e42] rounded p-2 text-sm focus:outline-none focus:border-[#007acc] resize-none"
                    />

                    {/* Advanced Options Toggle */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-1 text-[10px] text-[#858585] hover:text-white transition-colors"
                    >
                        <ChevronDown className={cn("h-3 w-3 transition-transform", showAdvanced && "rotate-180")} />
                        Advanced Options
                    </button>

                    {/* Backdate Input */}
                    {showAdvanced && (
                        <div className="flex flex-col gap-2 p-2 bg-[#2a2d2e] rounded border border-[#3e3e42]">
                            <label className="flex items-center gap-2 text-[11px] text-[#969696]">
                                <Calendar className="h-3 w-3" />
                                Commit Date (Backdate)
                            </label>
                            <input
                                type="datetime-local"
                                value={commitDate}
                                onChange={(e) => setCommitDate(e.target.value)}
                                className="bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#007acc]"
                            />
                            <p className="text-[10px] text-[#6e6e6e]">
                                Leave empty for current time. Backdating is safe for contribution graph green squares.
                            </p>
                        </div>
                    )}

                    <Button
                        size="sm"
                        onClick={handleCommit}
                        disabled={committing || changes.length === 0}
                        className="w-full bg-[#007acc] hover:bg-[#0062a3] text-white h-8"
                    >
                        {committing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        {commitDate ? 'Commit (Backdated)' : 'Commit'}
                    </Button>
                </div>

                {/* Changes List */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#969696] mb-1">
                        <span>Changes</span>
                        <span className="bg-[#474747] text-white px-1.5 rounded-full text-[10px]">{changes.length}</span>
                    </div>

                    <div className="flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar">
                        {changes.length === 0 ? (
                            <div className="py-2 text-xs text-[#6e6e6e] italic">No changes detected</div>
                        ) : (
                            changes.map((change, idx) => {
                                const info = getStatusInfo(change.status);
                                return (
                                    <div
                                        key={idx}
                                        className="group flex items-center gap-2 py-1 px-1 hover:bg-[#2a2d2e] cursor-pointer rounded"
                                        title={`${info.title}: ${change.file}`}
                                    >
                                        <FileCode className="h-4 w-4 text-[#858585]" />
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-xs truncate text-[#cccccc]">{change.file.split('/').pop()}</span>
                                            <span className="text-[10px] text-[#6e6e6e] truncate">{change.file}</span>
                                        </div>
                                        <span className={cn("text-[10px] font-bold w-4 text-center", info.color)}>
                                            {info.label}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Advanced Sync */}
                {changes.length === 0 && (
                    <div className="mt-auto flex flex-col gap-2 border-t border-[#3c3c3c] pt-4">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleSync}
                            disabled={syncing}
                            className="bg-[#3e3e42] hover:bg-[#45454b] text-white h-8 text-xs"
                        >
                            {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                            Sync Changes
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
