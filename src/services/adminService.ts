import { supabase } from "@/integrations/supabase/client";

export interface AdminUser {
    id: string;
    user_id: string;
    role: 'super_admin' | 'admin' | 'user';
    can_create_campaigns: boolean;
    can_manage_users: boolean;
    max_campaigns: number;
    subscription_plan: 'free' | 'yearly' | 'three_year';
    subscription_start: string | null;
    subscription_end: string | null;
    created_at: string;
}

export interface BusinessProfile {
    id: string;
    user_id: string;
    business_name: string;
    business_category: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    whatsapp: string;
    email: string;
    google_review_url: string;
    google_place_id: string;
    logo_url: string;
    nfc_card_assigned: boolean;
    nfc_card_id: string | null;
    created_at: string;
}

// Check if user has admin access
export const checkAdminAccess = async (userId: string): Promise<AdminUser | null> => {
    try {
        const { data, error } = await (supabase as any)
            .from('admin_users')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.log('No admin record found, user has no special access');
            return null;
        }

        return data as AdminUser;
    } catch (error) {
        console.error('Error checking admin access:', error);
        return null;
    }
};

// Check if user can create campaigns
export const canCreateCampaign = async (userId: string): Promise<{ allowed: boolean; reason: string; remaining: number }> => {
    try {
        const adminUser = await checkAdminAccess(userId);

        if (!adminUser) {
            return {
                allowed: false,
                reason: "You don't have permission to create campaigns. Please contact admin to get access.",
                remaining: 0
            };
        }

        if (!adminUser.can_create_campaigns) {
            return {
                allowed: false,
                reason: "Campaign creation is disabled for your account. Please contact admin.",
                remaining: 0
            };
        }

        // Check subscription validity
        if (adminUser.subscription_end) {
            const endDate = new Date(adminUser.subscription_end);
            if (endDate < new Date()) {
                return {
                    allowed: false,
                    reason: "Your subscription has expired. Please renew to continue creating campaigns.",
                    remaining: 0
                };
            }
        }

        // Check campaign quota
        const { data: campaigns, error } = await (supabase as any)
            .from('campaigns')
            .select('id')
            .eq('owner_id', userId);

        if (error) {
            console.error('Error fetching campaigns:', error);
            return { allowed: false, reason: "Error checking campaign quota", remaining: 0 };
        }

        const currentCount = campaigns?.length || 0;
        const remaining = adminUser.max_campaigns - currentCount;

        if (remaining <= 0) {
            return {
                allowed: false,
                reason: `You have reached your campaign limit (${adminUser.max_campaigns}). Please upgrade your plan.`,
                remaining: 0
            };
        }

        return {
            allowed: true,
            reason: "You can create campaigns",
            remaining
        };
    } catch (error) {
        console.error('Error in canCreateCampaign:', error);
        return { allowed: false, reason: "An error occurred", remaining: 0 };
    }
};

// Get user's business profile
export const getBusinessProfile = async (userId: string): Promise<BusinessProfile | null> => {
    try {
        const { data, error } = await (supabase as any)
            .from('business_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.log('No business profile found');
            return null;
        }

        return data as BusinessProfile;
    } catch (error) {
        console.error('Error fetching business profile:', error);
        return null;
    }
};

// Create or update business profile
export const upsertBusinessProfile = async (
    userId: string,
    profileData: Partial<BusinessProfile>
): Promise<BusinessProfile | null> => {
    try {
        const { data, error } = await (supabase as any)
            .from('business_profiles')
            .upsert({
                user_id: userId,
                ...profileData,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Error upserting business profile:', error);
            return null;
        }

        return data as BusinessProfile;
    } catch (error) {
        console.error('Error in upsertBusinessProfile:', error);
        return null;
    }
};

// ADMIN ONLY: Grant campaign access to a user
export const grantCampaignAccess = async (
    adminUserId: string,
    targetUserId: string,
    options: {
        max_campaigns?: number;
        subscription_plan?: 'free' | 'yearly' | 'three_year';
        subscription_days?: number;
    }
): Promise<{ success: boolean; message: string }> => {
    try {
        // First check if requester is admin
        const adminUser = await checkAdminAccess(adminUserId);

        if (!adminUser || (adminUser.role !== 'super_admin' && adminUser.role !== 'admin')) {
            return {
                success: false,
                message: "You don't have permission to grant access to users."
            };
        }

        if (adminUser.role === 'admin' && !adminUser.can_manage_users) {
            return {
                success: false,
                message: "You don't have user management permissions."
            };
        }

        // Calculate subscription dates
        const subscriptionStart = new Date();
        let subscriptionEnd: Date | null = null;

        if (options.subscription_days) {
            subscriptionEnd = new Date();
            subscriptionEnd.setDate(subscriptionEnd.getDate() + options.subscription_days);
        } else if (options.subscription_plan === 'yearly') {
            subscriptionEnd = new Date();
            subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
        } else if (options.subscription_plan === 'three_year') {
            subscriptionEnd = new Date();
            subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 3);
        }

        // Upsert admin_users record for target user
        const { error } = await (supabase as any)
            .from('admin_users')
            .upsert({
                user_id: targetUserId,
                role: 'user',
                can_create_campaigns: true,
                can_manage_users: false,
                max_campaigns: options.max_campaigns || 3,
                subscription_plan: options.subscription_plan || 'yearly',
                subscription_start: subscriptionStart.toISOString(),
                subscription_end: subscriptionEnd?.toISOString() || null,
                created_by: adminUserId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('Error granting access:', error);
            return { success: false, message: "Failed to grant access: " + error.message };
        }

        return {
            success: true,
            message: `Campaign access granted successfully. User can now create up to ${options.max_campaigns || 3} campaigns.`
        };
    } catch (error) {
        console.error('Error in grantCampaignAccess:', error);
        return { success: false, message: "An unexpected error occurred" };
    }
};

// ADMIN ONLY: Revoke campaign access
export const revokeCampaignAccess = async (
    adminUserId: string,
    targetUserId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const adminUser = await checkAdminAccess(adminUserId);

        if (!adminUser || (adminUser.role !== 'super_admin' && adminUser.role !== 'admin')) {
            return { success: false, message: "You don't have permission to revoke access." };
        }

        const { error } = await (supabase as any)
            .from('admin_users')
            .update({
                can_create_campaigns: false,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', targetUserId);

        if (error) {
            return { success: false, message: "Failed to revoke access: " + error.message };
        }

        return { success: true, message: "Campaign access revoked successfully." };
    } catch (error) {
        console.error('Error in revokeCampaignAccess:', error);
        return { success: false, message: "An unexpected error occurred" };
    }
};

// ADMIN ONLY: Get all users with their access details
export const getAllUsersWithAccess = async (adminUserId: string): Promise<AdminUser[] | null> => {
    try {
        const adminUser = await checkAdminAccess(adminUserId);

        if (!adminUser || adminUser.role !== 'super_admin') {
            console.log('Only super admins can view all users');
            return null;
        }

        const { data, error } = await (supabase as any)
            .from('admin_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return null;
        }

        return data as AdminUser[];
    } catch (error) {
        console.error('Error in getAllUsersWithAccess:', error);
        return null;
    }
};

// ADMIN ONLY: Get all business profiles
export const getAllBusinessProfiles = async (adminUserId: string): Promise<BusinessProfile[] | null> => {
    try {
        const adminUser = await checkAdminAccess(adminUserId);

        if (!adminUser || (adminUser.role !== 'super_admin' && adminUser.role !== 'admin')) {
            console.log('Only admins can view business profiles');
            return null;
        }

        const { data, error } = await (supabase as any)
            .from('business_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching business profiles:', error);
            return null;
        }

        return data as BusinessProfile[];
    } catch (error) {
        console.error('Error in getAllBusinessProfiles:', error);
        return null;
    }
};

// Get subscription details
export const getSubscriptionDetails = async (userId: string): Promise<{
    plan: string;
    isActive: boolean;
    daysRemaining: number;
    expiryDate: string | null;
} | null> => {
    try {
        const adminUser = await checkAdminAccess(userId);

        if (!adminUser) {
            return null;
        }

        let isActive = true;
        let daysRemaining = 0;

        if (adminUser.subscription_end) {
            const endDate = new Date(adminUser.subscription_end);
            const today = new Date();
            isActive = endDate >= today;
            daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        } else {
            // No end date means lifetime access
            daysRemaining = 9999;
        }

        return {
            plan: adminUser.subscription_plan,
            isActive,
            daysRemaining,
            expiryDate: adminUser.subscription_end
        };
    } catch (error) {
        console.error('Error getting subscription details:', error);
        return null;
    }
};
