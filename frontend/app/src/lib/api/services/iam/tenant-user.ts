import { api } from '../../client'
import type {
    TenantMemberItem,
    PaginatedTenantMemberResponse,
    PaginatedTenantInvitationResponse,
    TenantUserInvitePayload,
    TenantUserRoleUpdatePayload,
    TenantUserScopesUpdatePayload,
    TenantUserStatusTogglePayload,
    TenantUserRemovePayload,
    TenantOwnershipTransferPayload,
} from '@/types/iam'

export interface GetTenantUsersParams {
    search?: string
    page?: number
    page_size?: number
    sort_order?: 'asc' | 'desc'
}

export const tenantUserService = {
    async getMembers(params?: GetTenantUsersParams): Promise<PaginatedTenantMemberResponse> {
        return await api.get<PaginatedTenantMemberResponse>('/tenants/current/users', {
            params,
        })
    },

    async getInvitations(params?: GetTenantUsersParams): Promise<PaginatedTenantInvitationResponse> {
        return await api.get<PaginatedTenantInvitationResponse>('/tenants/current/invitations', {
            params,
        })
    },

    async inviteUser(payload: TenantUserInvitePayload): Promise<{ message: string; invitation_url: string }> {
        return await api.post<{ message: string; invitation_url: string }>('/tenants/current/users/invite', payload)
    },

    async cancelInvitation(invitationId: string): Promise<{ status: string; message: string }> {
        return await api.delete<{ status: string; message: string }>(`/tenants/current/invitations/${invitationId}`)
    },

    async updateUserRole(userId: string, payload: TenantUserRoleUpdatePayload): Promise<TenantMemberItem> {
        return await api.patch<TenantMemberItem>(`/tenants/current/users/${userId}/role`, payload)
    },

    async updateUserScopes(userId: string, payload: TenantUserScopesUpdatePayload): Promise<TenantMemberItem> {
        return await api.patch<TenantMemberItem>(`/tenants/current/users/${userId}/scopes`, payload)
    },

    async toggleUserStatus(userId: string, payload: TenantUserStatusTogglePayload): Promise<TenantMemberItem> {
        return await api.patch<TenantMemberItem>(`/tenants/current/users/${userId}/status`, payload)
    },

    async removeUser(userId: string, payload: TenantUserRemovePayload): Promise<{ status: string; message: string }> {
        return await api.post<{ status: string; message: string }>(`/tenants/current/users/${userId}/remove`, payload)
    },

    async transferOwnership(payload: TenantOwnershipTransferPayload): Promise<{ status: string; message: string }> {
        return await api.post<{ status: string; message: string }>('/tenants/current/transfer-ownership', payload)
    },
}
