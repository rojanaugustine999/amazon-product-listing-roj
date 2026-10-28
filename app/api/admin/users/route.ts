import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AuthenticatedAdminResult =
    | {
          callerUser: { id: string; email?: string };
          errorResponse?: never;
      }
    | {
          callerUser?: never;
          errorResponse: NextResponse;
      };

/**
 * Helper to authenticate caller session and verify administrator role in public.profiles.
 */
async function authenticateAdmin(): Promise<AuthenticatedAdminResult> {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        console.warn(
            "[ADMIN_AUTH] Verification failed: unauthenticated session",
            authError?.message || "No active session"
        );
        return {
            errorResponse: NextResponse.json(
                { error: "Authentication required." },
                { status: 401 }
            ),
        };
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
        console.error(
            "[ADMIN_AUTH] Verification failed: profile query error",
            profileError.message
        );
        return {
            errorResponse: NextResponse.json(
                { error: "Access denied. Administrator privileges required." },
                { status: 403 }
            ),
        };
    }

    if (profile?.role !== "admin") {
        console.warn(
            "[ADMIN_AUTH] Verification failed: insufficient role",
            profile ? `role=${profile.role}` : "profile missing"
        );
        return {
            errorResponse: NextResponse.json(
                { error: "Access denied. Administrator privileges required." },
                { status: 403 }
            ),
        };
    }

    return { callerUser: user };
}

/**
 * GET /api/admin/users
 * Returns a list of users with id, email, full_name, role, and created_at.
 * Supports query params: page, limit, search.
 * Handles > 1,000 Supabase Auth users accurately without loading all users into memory unnecessarily.
 */
export async function GET(request: Request) {
    try {
        const authResult = await authenticateAdmin();
        if (authResult.errorResponse) {
            return authResult.errorResponse;
        }

        const { searchParams } = new URL(request.url);

        const pageParam = parseInt(searchParams.get("page") || "1", 10);
        const limitParam = parseInt(searchParams.get("limit") || "20", 10);

        // 1. Limit the search query length to 100 characters before searching
        const rawSearch = (
            searchParams.get("search") ||
            searchParams.get("q") ||
            ""
        ).trim();
        const searchQuery = rawSearch.slice(0, 100).toLowerCase();

        const page =
            Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
        const limit =
            Number.isInteger(limitParam) && limitParam > 0
                ? Math.min(limitParam, 100)
                : 20;

        const adminSupabase = createAdminClient();

        // 2. Optimized user retrieval and pagination
        if (!searchQuery) {
            // Case A: Standard browsing without search.
            // Delegate pagination directly to Supabase Auth so only the requested page of users is fetched.
            // Avoids loading all users into memory and accurately scales beyond 1,000 users.
            const { data: authData, error: authUsersError } =
                await adminSupabase.auth.admin.listUsers({
                    page,
                    perPage: limit,
                });

            if (authUsersError) {
                console.error(
                    "Failed to list auth users:",
                    authUsersError.message
                );
                return NextResponse.json(
                    { error: "Failed to retrieve user directory." },
                    { status: 500 }
                );
            }

            const pageUsers = authData?.users ?? [];
            const userIds = pageUsers.map((u) => u.id);

            // Fetch profiles ONLY for the specific users on this page
            let profiles: Array<{
                id: string;
                full_name?: string | null;
                role?: string | null;
            }> = [];

            if (userIds.length > 0) {
                const { data: profileRows, error: profilesError } =
                    await adminSupabase
                        .from("profiles")
                        .select("id, full_name, role")
                        .in("id", userIds);

                if (profilesError) {
                    console.error(
                        "Failed to fetch profiles:",
                        profilesError.message
                    );
                    return NextResponse.json(
                        { error: "Failed to retrieve user profiles." },
                        { status: 500 }
                    );
                }
                profiles = profileRows || [];
            }

            const profileMap = new Map(profiles.map((p) => [p.id, p]));

            const paginatedUsers = pageUsers.map((user) => {
                const profile = profileMap.get(user.id);
                const fullName =
                    profile?.full_name ||
                    (user.user_metadata?.full_name as string) ||
                    "";
                const role = profile?.role === "admin" ? "admin" : "customer";

                return {
                    id: user.id,
                    email: user.email || "",
                    full_name: fullName,
                    role,
                    created_at: user.created_at,
                };
            });

            // Use Supabase GoTrue's total user count
            const total =
                typeof authData?.total === "number"
                    ? authData.total
                    : paginatedUsers.length;
            const totalPages = Math.ceil(total / limit) || 1;

            return NextResponse.json({
                users: paginatedUsers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            });
        }

        // Case B: Search query present (clamped to <= 100 characters).
        // Find matching profiles first to capture matches by display name.
        const { data: nameMatchingProfiles } = await adminSupabase
            .from("profiles")
            .select("id, full_name, role")
            .ilike("full_name", `%${searchQuery}%`)
            .limit(1000);

        const nameMatchedIdMap = new Map(
            (nameMatchingProfiles || []).map((p) => [p.id, p])
        );

        // Paginate across Auth batches of 1,000 without retaining non-matching users in memory.
        let authPage = 1;
        let hasMore = true;
        const matchedUsers: Array<{
            id: string;
            email: string;
            full_name: string;
            role: string;
            created_at: string;
        }> = [];

        // Safety limit for maximum accumulated search results to prevent memory bloat
        const MAX_SEARCH_RESULTS = 2000;

        while (hasMore) {
            const { data: pageData, error: pageError } =
                await adminSupabase.auth.admin.listUsers({
                    page: authPage,
                    perPage: 1000,
                });

            if (pageError || !pageData?.users || pageData.users.length === 0) {
                break;
            }

            for (const user of pageData.users) {
                const email = (user.email || "").toLowerCase();
                const metaName = (
                    typeof user.user_metadata?.full_name === "string"
                        ? user.user_metadata.full_name
                        : ""
                ).toLowerCase();
                const profileMatch = nameMatchedIdMap.get(user.id);

                if (
                    email.includes(searchQuery) ||
                    metaName.includes(searchQuery) ||
                    profileMatch
                ) {
                    const fullName =
                        profileMatch?.full_name ||
                        (user.user_metadata?.full_name as string) ||
                        "";
                    const role =
                        profileMatch?.role === "admin" ? "admin" : "customer";

                    matchedUsers.push({
                        id: user.id,
                        email: user.email || "",
                        full_name: fullName,
                        role,
                        created_at: user.created_at,
                    });

                    if (matchedUsers.length >= MAX_SEARCH_RESULTS) {
                        hasMore = false;
                        break;
                    }
                }
            }

            if (!pageData.nextPage || pageData.users.length < 1000) {
                hasMore = false;
            } else {
                authPage++;
            }
        }

        // Sort matched users by creation date descending
        matchedUsers.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime() || 0;
            const timeB = new Date(b.created_at).getTime() || 0;
            return timeB - timeA;
        });

        const total = matchedUsers.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginatedUsers = matchedUsers.slice(
            startIndex,
            startIndex + limit
        );

        // Fetch profile data for matched users on current page if not already retrieved
        const missingProfileIds = paginatedUsers
            .filter((u) => !nameMatchedIdMap.has(u.id))
            .map((u) => u.id);

        if (missingProfileIds.length > 0) {
            const { data: extraProfiles } = await adminSupabase
                .from("profiles")
                .select("id, full_name, role")
                .in("id", missingProfileIds);

            if (extraProfiles) {
                const extraMap = new Map(extraProfiles.map((p) => [p.id, p]));
                for (const u of paginatedUsers) {
                    const extra = extraMap.get(u.id);
                    if (extra) {
                        if (extra.full_name) u.full_name = extra.full_name;
                        u.role = extra.role === "admin" ? "admin" : "customer";
                    }
                }
            }
        }

        return NextResponse.json({
            users: paginatedUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        });
    } catch (err) {
        console.error(
            "[ADMIN_USERS_GET] Unexpected failure:",
            err instanceof Error ? err.stack || err.message : err
        );
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/users
 * Updates target user's role in public.profiles.
 * Validates role ('admin' or 'customer').
 * Prevents self-demotion and demoting the last remaining administrator.
 */
export async function PATCH(request: Request) {
    try {
        const authResult = await authenticateAdmin();
        if (authResult.errorResponse) {
            return authResult.errorResponse;
        }
        const { callerUser } = authResult;

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON request body." },
                { status: 400 }
            );
        }

        if (!body || typeof body !== "object") {
            return NextResponse.json(
                { error: "Request body must be an object." },
                { status: 400 }
            );
        }

        const { userId, role } = body as {
            userId?: unknown;
            role?: unknown;
        };

        if (typeof userId !== "string" || !UUID_REGEX.test(userId)) {
            return NextResponse.json(
                { error: "A valid user ID (UUID) is required." },
                { status: 400 }
            );
        }

        if (role !== "admin" && role !== "customer") {
            return NextResponse.json(
                { error: "Invalid role. Role must be 'admin' or 'customer'." },
                { status: 400 }
            );
        }

        // Prevent an administrator from changing their own role
        if (userId === callerUser.id) {
            return NextResponse.json(
                { error: "You cannot change your own administrator role." },
                { status: 400 }
            );
        }

        const adminSupabase = createAdminClient();

        // Check if target user exists in auth
        const { data: targetAuthUser, error: targetAuthError } =
            await adminSupabase.auth.admin.getUserById(userId);

        if (targetAuthError || !targetAuthUser?.user) {
            return NextResponse.json(
                { error: "Target user not found." },
                { status: 404 }
            );
        }

        // Check current profile of target user
        const { data: existingProfile, error: profileFetchError } =
            await adminSupabase
                .from("profiles")
                .select("id, full_name, role")
                .eq("id", userId)
                .maybeSingle();

        if (profileFetchError) {
            console.error(
                "Failed to query target profile:",
                profileFetchError.message
            );
            return NextResponse.json(
                { error: "Failed to verify target user profile." },
                { status: 500 }
            );
        }

        const currentRole = existingProfile?.role || "customer";

        // Prevent demoting the last remaining administrator
        if (currentRole === "admin" && role === "customer") {
            const { count, error: countError } = await adminSupabase
                .from("profiles")
                .select("id", { count: "exact", head: true })
                .eq("role", "admin");

            if (countError) {
                console.error(
                    "Failed to count admin profiles:",
                    countError.message
                );
                return NextResponse.json(
                    { error: "Failed to verify administrator count." },
                    { status: 500 }
                );
            }

            if (count !== null && count <= 1) {
                return NextResponse.json(
                    { error: "Cannot demote the last remaining administrator." },
                    { status: 400 }
                );
            }
        }

        // Update or insert into public.profiles
        let updatedProfile: {
            id: string;
            role: string;
            full_name?: string | null;
        } | null = null;

        if (existingProfile) {
            const { data, error: updateError } = await adminSupabase
                .from("profiles")
                .update({ role })
                .eq("id", userId)
                .select("id, full_name, role")
                .maybeSingle();

            if (updateError) {
                console.error(
                    "Failed to update profile role:",
                    updateError.message
                );
                return NextResponse.json(
                    { error: "Database error while updating user role." },
                    { status: 500 }
                );
            }
            updatedProfile = data;
        } else {
            const fullName =
                (targetAuthUser.user.user_metadata?.full_name as string) || null;
            const { data, error: insertError } = await adminSupabase
                .from("profiles")
                .insert({
                    id: userId,
                    role,
                    full_name: fullName,
                })
                .select("id, full_name, role")
                .maybeSingle();

            if (insertError) {
                console.error(
                    "Failed to insert profile record:",
                    insertError.message
                );
                return NextResponse.json(
                    { error: "Database error while creating user profile." },
                    { status: 500 }
                );
            }
            updatedProfile = data;
        }

        return NextResponse.json({
            success: true,
            user: {
                id: userId,
                email: targetAuthUser.user.email || "",
                full_name:
                    updatedProfile?.full_name ||
                    (targetAuthUser.user.user_metadata?.full_name as string) ||
                    "",
                role,
            },
        });
    } catch (err) {
        console.error(
            "[ADMIN_USERS_PATCH] Unexpected failure:",
            err instanceof Error ? err.stack || err.message : err
        );
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
