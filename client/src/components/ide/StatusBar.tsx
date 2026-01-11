"use client";

import { GitBranch, Radio, Check, XCircle, AlertTriangle } from "lucide-react";

export function StatusBar() {
    return (
        <div className="flex h-6 w-full items-center justify-between bg-[#007acc] px-2 text-[11px] text-white">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded">
                    <GitBranch className="h-3 w-3" />
                    <span>main</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded">
                    <XCircle className="h-3 w-3" />
                    <span>0</span>
                    <AlertTriangle className="h-3 w-3 ml-1" />
                    <span>0</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded">
                    Ln 1, Col 1
                </div>
                <div className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded">
                    UTF-8
                </div>
                <div className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded">
                    JavaScript React
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded">
                    <Radio className="h-3 w-3" />
                    <span>Go Live</span>
                </div>
                <div className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded">
                    Prettier
                </div>
            </div>
        </div>
    );
}
