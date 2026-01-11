"use client";

import { Files, Search, GitGraph, Settings, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityBarProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

export function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
    const items = [
        { id: "explorer", icon: Files },
        { id: "search", icon: Search },
        { id: "git", icon: GitGraph },
    ];

    return (
        <div className="flex w-12 flex-col items-center justify-between border-r bg-[#18181b] py-2 text-[#858585]">
            <div className="flex flex-col items-center gap-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "cursor-pointer border-l-2 border-transparent p-2 transition-colors hover:text-white",
                            activeView === item.id ? "border-white text-white" : ""
                        )}
                        onClick={() => onViewChange(item.id)}
                    >
                        <item.icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                ))}
            </div>
            <div className="flex flex-col items-center gap-4 pb-2">
                <div className="cursor-pointer p-2 hover:text-white">
                    <Settings className="h-6 w-6" strokeWidth={1.5} />
                </div>
            </div>
        </div>
    );
}
