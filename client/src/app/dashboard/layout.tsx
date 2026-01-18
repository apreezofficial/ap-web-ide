"use client";

import { Button } from "@/components/ui/button";
import { Code2, LogOut, LayoutDashboard, Github, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const data = await fetchAPI("/auth/user.php");
            if (!data.authenticated) {
                router.push("/");
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Auth check failed", error);
            router.push("/");
        }
    };

    const handleLogout = () => {
        window.location.href = "http://localhost/ap%20ai%20ide/server/api/auth/logout.php";
    };

    const tabs = [
        { name: "Projects", href: "/dashboard/projects", icon: LayoutDashboard },
        { name: "GitHub Repos", href: "/dashboard/repos", icon: Github },
    ];

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
                        <Code2 className="h-6 w-6 text-primary" />
                        <span>AP AI IDE</span>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </Button>
                </div>
            </header>

            <main className="flex-1 container mx-auto py-8 px-4 max-w-7xl">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">Manage your projects and GitHub repositories</p>
                    </div>
                    <div className="flex bg-muted p-1 rounded-lg w-full md:w-auto overflow-x-auto shadow-inner">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${pathname === tab.href
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.name}
                            </Link>
                        ))}
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
}
