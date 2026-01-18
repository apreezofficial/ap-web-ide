"use client";

import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "loading";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

let toastListener: ((toast: Toast) => void) | null = null;

export const toast = {
    show: (message: string, type: ToastType = "info") => {
        if (toastListener) {
            toastListener({ id: Math.random().toString(36).substr(2, 9), message, type });
        }
    },
    success: (message: string) => toast.show(message, "success"),
    error: (message: string) => toast.show(message, "error"),
    loading: (message: string) => toast.show(message, "loading"),
};

export function Toaster() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        toastListener = (newToast) => {
            setToasts((prev) => [...prev, newToast]);
            if (newToast.type !== "loading") {
                setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
                }, 4000);
            }
        };
        return () => {
            toastListener = null;
        };
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={cn(
                        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border transform transition-all duration-300 animate-in slide-in-from-right-full",
                        t.type === "success" && "bg-[#1e1e1e] border-green-500/50 text-white",
                        t.type === "error" && "bg-[#1e1e1e] border-red-500/50 text-white",
                        t.type === "loading" && "bg-[#1e1e1e] border-primary/50 text-white",
                        t.type === "info" && "bg-[#1e1e1e] border-[#333] text-white"
                    )}
                >
                    {t.type === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {t.type === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                    {t.type === "loading" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    {t.type === "info" && <Info className="h-5 w-5 text-blue-500" />}

                    <span className="text-sm font-medium">{t.message}</span>

                    <button
                        onClick={() => removeToast(t.id)}
                        className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
                    >
                        <X className="h-4 w-4 opacity-50" />
                    </button>
                </div>
            ))}
        </div>
    );
}
