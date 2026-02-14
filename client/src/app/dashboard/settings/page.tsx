"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAPI } from "@/lib/api";
import { User, ShieldAlert, Trash2, Save, RefreshCw } from "lucide-react";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const data = await fetchAPI("/auth/user.php");
            if (data.authenticated) {
                setUser(data.user);
                setName(data.user.name || "");
                setBio(data.user.bio || "");
            }
        } catch (error) {
            console.error("Failed to load user", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            await fetchAPI("/auth/update_user.php", {
                method: "POST",
                body: JSON.stringify({ name, bio }),
            });
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleClearAllProjects = async () => {
        if (!confirm("CRITICAL WARNING: This will permanently delete ALL your projects and files. This action cannot be undone. Are you absolutely sure?")) {
            return;
        }

        setClearing(true);
        try {
            await fetchAPI("/projects/clear_all.php", {
                method: "POST"
            });
            alert("All projects cleared successfully.");
        } catch (error) {
            alert("Failed to clear projects");
        } finally {
            setClearing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <CardTitle>Profile Settings</CardTitle>
                    </div>
                    <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Username (GitHub)</label>
                        <Input value={user?.username} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Display Name</label>
                        <Input
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Bio</label>
                        <textarea
                            className="w-full min-h-[100px] px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Tell us about yourself..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleUpdateProfile} disabled={saving} className="ml-auto">
                        {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            <Card className="border-destructive/50 overflow-hidden">
                <div className="bg-destructive/10 px-6 py-4 border-b border-destructive/20 flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-5 w-5" />
                    <h3 className="font-bold">Danger Zone</h3>
                </div>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="font-semibold text-destructive">Clear All Projects</p>
                            <p className="text-sm text-muted-foreground">Irreversibly delete all your projects and their associated files from the server.</p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleClearAllProjects}
                            disabled={clearing}
                        >
                            {clearing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Clear All
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
