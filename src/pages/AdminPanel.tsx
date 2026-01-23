import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
    Shield, Users, UserPlus, LogOut, Search,
    CheckCircle2, XCircle, Calendar, Crown, Settings,
    ArrowLeft, Loader2
} from "lucide-react";
import {
    checkAdminAccess,
    grantCampaignAccess,
    revokeCampaignAccess,
    getAllUsersWithAccess,
    type AdminUser
} from "@/services/adminService";
import type { User } from "@supabase/supabase-js";

const AdminPanel = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Form state for granting access
    const [showGrantForm, setShowGrantForm] = useState(false);
    const [grantEmail, setGrantEmail] = useState("");
    const [grantPlan, setGrantPlan] = useState<'yearly'>('yearly');
    const [grantMaxCampaigns, setGrantMaxCampaigns] = useState(3);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    navigate("/auth");
                    return;
                }

                setUser(session.user);

                // Check admin access
                const admin = await checkAdminAccess(session.user.id);

                if (!admin || (admin.role !== 'super_admin' && admin.role !== 'admin')) {
                    toast({
                        title: "Access Denied",
                        description: "You don't have admin access to this panel.",
                        variant: "destructive"
                    });
                    navigate("/dashboard");
                    return;
                }

                setAdminUser(admin);

                // Load all users if super admin
                if (admin.role === 'super_admin') {
                    const users = await getAllUsersWithAccess(session.user.id);
                    setAllUsers(users || []);
                }
            } catch (error) {
                console.error('Auth error:', error);
                navigate("/auth");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [navigate, toast]);

    const handleGrantAccess = async () => {
        if (!user || !grantEmail.trim()) {
            toast({
                title: "Error",
                description: "Please enter a valid email address.",
                variant: "destructive"
            });
            return;
        }

        setActionLoading('grant');

        try {
            // First, find user by email
            const { data: userData, error: userError } = await (supabase as any)
                .from('auth.users')
                .select('id')
                .eq('email', grantEmail.trim())
                .single();

            // If direct query fails, try a different approach
            // In production, you'd have a proper users table linked to auth.users

            // For now, we'll create a pending invitation or use admin API
            toast({
                title: "Info",
                description: "Looking up user...",
            });

            // Simulate lookup - in production, use Supabase Admin API or a users table
            const result = await grantCampaignAccess(user.id, grantEmail.trim(), {
                subscription_plan: grantPlan,
                max_campaigns: grantMaxCampaigns,
                subscription_days: grantPlan === 'yearly' ? 365 : 1095
            });

            if (result.success) {
                toast({
                    title: "Success!",
                    description: result.message,
                });
                setShowGrantForm(false);
                setGrantEmail("");

                // Refresh users list
                if (adminUser?.role === 'super_admin') {
                    const users = await getAllUsersWithAccess(user.id);
                    setAllUsers(users || []);
                }
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Grant access error:', error);
            toast({
                title: "Error",
                description: "Failed to grant access. Please try again.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevokeAccess = async (targetUserId: string) => {
        if (!user) return;

        setActionLoading(targetUserId);

        try {
            const result = await revokeCampaignAccess(user.id, targetUserId);

            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                });

                // Refresh users list
                if (adminUser?.role === 'super_admin') {
                    const users = await getAllUsersWithAccess(user.id);
                    setAllUsers(users || []);
                }
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to revoke access.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    const filteredUsers = allUsers.filter(u =>
        u.user_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="flex items-center gap-3 text-gray-600">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading admin panel...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/20">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div className="flex items-center gap-4">
                            <img src="/logo.jpg" alt="Creative Mark Logo" className="h-12 w-auto object-contain" />
                            <h1 className="text-xl font-bold border-l pl-4">Admin Panel</h1>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Total Users</p>
                                    <h3 className="text-3xl font-bold">{allUsers.length}</h3>
                                </div>
                                <Users className="h-10 w-10 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Active Subscriptions</p>
                                    <h3 className="text-3xl font-bold">
                                        {allUsers.filter(u => u.can_create_campaigns).length}
                                    </h3>
                                </div>
                                <CheckCircle2 className="h-10 w-10 text-green-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-none shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-100 text-sm font-medium">Expired/Inactive</p>
                                    <h3 className="text-3xl font-bold">
                                        {allUsers.filter(u => !u.can_create_campaigns).length}
                                    </h3>
                                </div>
                                <XCircle className="h-10 w-10 text-red-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Grant Access Section */}
                <Card className="mb-8 border-2 border-dashed border-red-200 hover:border-red-400 transition-colors">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-red-600" />
                                    Grant Campaign Access
                                </CardTitle>
                                <CardDescription>
                                    Give a user permission to create QR campaigns
                                </CardDescription>
                            </div>
                            <Button
                                onClick={() => setShowGrantForm(!showGrantForm)}
                                className="bg-gradient-to-r from-red-600 to-red-500"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                {showGrantForm ? 'Cancel' : 'Grant Access'}
                            </Button>
                        </div>
                    </CardHeader>

                    {showGrantForm && (
                        <CardContent className="border-t pt-6">
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="grant-email">User Email or ID</Label>
                                    <Input
                                        id="grant-email"
                                        type="text"
                                        placeholder="user@example.com or user_id"
                                        value={grantEmail}
                                        onChange={(e) => setGrantEmail(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="grant-plan">Subscription Plan</Label>
                                    <Select value={grantPlan} onValueChange={(v) => setGrantPlan(v as any)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yearly">Lifetime Pro (₹999)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="grant-max">Max Campaigns</Label>
                                    <Input
                                        id="grant-max"
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={grantMaxCampaigns}
                                        onChange={(e) => setGrantMaxCampaigns(parseInt(e.target.value) || 3)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleGrantAccess}
                                disabled={actionLoading === 'grant' || !grantEmail.trim()}
                                className="mt-4 bg-green-600 hover:bg-green-700"
                            >
                                {actionLoading === 'grant' ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Confirm Grant Access
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    )}
                </Card>

                {/* Users List */}
                {adminUser?.role === 'super_admin' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        All Users with Access
                                    </CardTitle>
                                    <CardDescription>
                                        Manage user permissions and subscriptions
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 w-64"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No users found</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredUsers.map((u) => (
                                        <div
                                            key={u.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.role === 'super_admin' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                                    u.role === 'admin' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                                                        'bg-gradient-to-br from-gray-400 to-gray-600'
                                                    } text-white font-bold`}>
                                                    {u.role === 'super_admin' ? <Crown className="h-5 w-5" /> :
                                                        u.role === 'admin' ? <Shield className="h-5 w-5" /> :
                                                            'U'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{u.user_id}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant={u.can_create_campaigns ? 'default' : 'secondary'} className={
                                                            u.can_create_campaigns ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                        }>
                                                            {u.can_create_campaigns ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                            Plan: {u.subscription_plan}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            • {u.max_campaigns} campaigns
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {u.subscription_end && (
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Calendar className="h-3 w-3" />
                                                            Expires: {new Date(u.subscription_end).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {/* Open edit modal */ }}
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                    {u.can_create_campaigns && u.role !== 'super_admin' && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleRevokeAccess(u.user_id)}
                                                            disabled={actionLoading === u.user_id}
                                                        >
                                                            {actionLoading === u.user_id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
};

export default AdminPanel;
