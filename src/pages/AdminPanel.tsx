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
                <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="h-9 md:h-10 px-2 md:px-4 shrink-0">
                            <ArrowLeft className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Back</span>
                        </Button>
                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                            <img src="/qr.jpg" alt="Creative Mark Logo" className="h-10 md:h-16 w-auto object-contain shrink-0" />
                            <h1 className="text-base md:text-xl font-bold border-l pl-3 md:pl-4 truncate">Admin Panel</h1>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-9 md:h-10 shrink-0">
                        <LogOut className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Sign Out</span>
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
                        <CardContent className="p-4 md:p-6 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 md:gap-0">
                                <div className="order-2 sm:order-1">
                                    <p className="text-blue-100 text-xs md:text-sm font-bold uppercase tracking-widest mb-1">Total Users</p>
                                    <h3 className="text-3xl md:text-4xl font-black italic">{allUsers.length}</h3>
                                </div>
                                <Users className="h-8 w-8 md:h-10 md:w-10 text-blue-200 opacity-50 sm:opacity-100 order-1 sm:order-2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg">
                        <CardContent className="p-4 md:p-6 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 md:gap-0">
                                <div className="order-2 sm:order-1">
                                    <p className="text-green-100 text-xs md:text-sm font-bold uppercase tracking-widest mb-1">Active Access</p>
                                    <h3 className="text-3xl md:text-4xl font-black italic">
                                        {allUsers.filter(u => u.can_create_campaigns).length}
                                    </h3>
                                </div>
                                <CheckCircle2 className="h-8 w-8 md:h-10 md:w-10 text-green-200 opacity-50 sm:opacity-100 order-1 sm:order-2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-none shadow-lg">
                        <CardContent className="p-4 md:p-6 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 md:gap-0">
                                <div className="order-2 sm:order-1">
                                    <p className="text-red-100 text-xs md:text-sm font-bold uppercase tracking-widest mb-1">Pending/Exp.</p>
                                    <h3 className="text-3xl md:text-4xl font-black italic">
                                        {allUsers.filter(u => !u.can_create_campaigns).length}
                                    </h3>
                                </div>
                                <XCircle className="h-8 w-8 md:h-10 md:w-10 text-red-200 opacity-50 sm:opacity-100 order-1 sm:order-2" />
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
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 border border-slate-100 rounded-2xl hover:bg-gray-50 transition-all gap-6"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${u.role === 'super_admin' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                                    u.role === 'admin' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                                                        'bg-slate-900'
                                                    } text-white font-bold shadow-lg`}>
                                                    {u.role === 'super_admin' ? <Crown className="h-6 w-6" /> :
                                                        u.role === 'admin' ? <Shield className="h-6 w-6" /> :
                                                            'U'}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-sm text-slate-950 truncate">{u.user_id}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <Badge variant={u.can_create_campaigns ? 'default' : 'secondary'} className={
                                                            u.can_create_campaigns ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                                        }>
                                                            {u.can_create_campaigns ? 'Verified' : 'Pending'}
                                                        </Badge>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                            {u.subscription_plan}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                                            {u.max_campaigns} Slots
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                                                {u.subscription_end && (
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expires On</p>
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                                            <Calendar className="h-3 h-3 text-red-600" />
                                                            {new Date(u.subscription_end).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {/* Open edit modal */ }}
                                                        className="h-10 w-10 rounded-xl"
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                    {u.can_create_campaigns && u.role !== 'super_admin' && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleRevokeAccess(u.user_id)}
                                                            disabled={actionLoading === u.user_id}
                                                            className="h-10 w-10 rounded-xl"
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
