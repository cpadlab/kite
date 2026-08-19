import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { UsersIcon, Building2Icon } from 'lucide-react'
import { PageBreadcrumb } from '@/components/blocks/breadcrumb'
import { UsersTable } from './components/table/table'
import { InviteModal } from './components/modals/invite'
import { EditUserRoleModal } from './components/modals/edit-role'
import { EditUserScopesModal } from './components/modals/edit-scopes'
import { ToggleUserStatusModal } from './components/modals/toggle-status'
import { RemoveUserModal } from './components/modals/remove'
import { TransferOwnershipModal } from './components/modals/transfer-ownership'
import { RevokeInviteModal } from './components/modals/revoke-invite'
import { tenantUserService } from '@/lib/api/services/iam/tenant-user'
import { loginService } from '@/lib/api/services/iam/login'
import { routeCache } from '@/lib/api/route-cache'
import { TenantsBreadcrumbData } from '../breadcrumb'
import type { TenantMemberItem, TenantInvitationItem, UserItem, PaginatedTenantMemberResponse } from '@/types/iam'

const TenantUsersPage: React.FC = () => {
    
    const { t } = useTranslation()

    const [currentUser, setCurrentUser] = useState<UserItem | null>(null)
    const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members')
    const [members, setMembers] = useState<TenantMemberItem[]>([])
    const [invitations, setInvitations] = useState<TenantInvitationItem[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [search, setSearch] = useState<string>('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [page, setPage] = useState<number>(1)
    const [pageSize] = useState<number>(10)
    const [total, setTotal] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
    const [isEditScopesOpen, setIsEditScopesOpen] = useState(false)
    const [isToggleStatusOpen, setIsToggleStatusOpen] = useState(false)
    const [isRemoveOpen, setIsRemoveOpen] = useState(false)
    const [isTransferOwnershipOpen, setIsTransferOwnershipOpen] = useState(false)
    const [isRevokeInviteOpen, setIsRevokeInviteOpen] = useState(false)
    const [selectedMember, setSelectedMember] = useState<TenantMemberItem | null>(null)
    const [selectedInvitation, setSelectedInvitation] = useState<TenantInvitationItem | null>(null)

    useEffect(() => {
        loginService.getMe().then((user) => {
            setCurrentUser(user)
        }).catch(() => {})
    }, [])

    const fetchData = useCallback(async () => {
        setIsLoading(true)

        const cacheKey = activeTab === 'members' ? '/tenant/users' : undefined
        if (cacheKey && !search.trim() && page === 1 && sortOrder === 'desc') {
            const cached = routeCache.get<PaginatedTenantMemberResponse>(cacheKey)
            if (cached && cached.items) {
                setMembers(cached.items || [])
                setTotal(cached.total || 0)
                setTotalPages(cached.total_pages || 1)
                setIsLoading(false)
                routeCache.clear(cacheKey)
                return
            }
        }

        try {
            if (activeTab === 'members') {
                const res = await tenantUserService.getMembers({
                    search: search.trim() || undefined,
                    page,
                    page_size: pageSize,
                    sort_order: sortOrder,
                })
                setMembers(res.items || [])
                setTotal(res.total || 0)
                setTotalPages(res.total_pages || 1)
            } else {
                const res = await tenantUserService.getInvitations({
                    search: search.trim() || undefined,
                    page,
                    page_size: pageSize,
                    sort_order: sortOrder,
                })
                setInvitations(res.items || [])
                setTotal(res.total || 0)
                setTotalPages(res.total_pages || 1)
            }
        } catch (err) {
            console.error('Failed to fetch tenant users/invitations:', err)
        } finally {
            setIsLoading(false)
        }
    }, [activeTab, search, page, pageSize, sortOrder])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSearchChange = (val: string) => {
        setSearch(val)
        setPage(1)
    }

    const handleSortOrderChange = (order: 'asc' | 'desc') => {
        setSortOrder(order)
        setPage(1)
    }

    const handleEditRole = (member: TenantMemberItem) => {
        setSelectedMember(member)
        setIsEditRoleOpen(true)
    }

    const handleEditScopes = (member: TenantMemberItem) => {
        setSelectedMember(member)
        setIsEditScopesOpen(true)
    }

    const handleToggleStatus = (member: TenantMemberItem) => {
        setSelectedMember(member)
        setIsToggleStatusOpen(true)
    }

    const handleRemoveMember = (member: TenantMemberItem) => {
        setSelectedMember(member)
        setIsRemoveOpen(true)
    }

    const handleTransferOwnership = (member: TenantMemberItem) => {
        setSelectedMember(member)
        setIsTransferOwnershipOpen(true)
    }

    const handleRevokeInvitation = (invitation: TenantInvitationItem) => {
        setSelectedInvitation(invitation)
        setIsRevokeInviteOpen(true)
    }

    return (
        <div className="space-y-4">

            <div className="space-y-4">
                <PageBreadcrumb category={{ label: 'layout.tenant', icon: Building2Icon }} current={{ label: 'layout.users', icon: UsersIcon }} items={TenantsBreadcrumbData} />
                <div className="space-y-1">
                    <h1 className="md:text-2xl text-xl font-semibold text-foreground">{t('pages.private.tenant.users.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('pages.private.tenant.users.subtitle')}</p>
                </div>
            </div>

            <UsersTable
                activeTab={activeTab}
                onTabChange={(tab) => {
                    setActiveTab(tab)
                    setPage(1)
                    setSearch('')
                }}
                members={members}
                invitations={invitations}
                isLoading={isLoading}
                total={total}
                page={page}
                pageSize={pageSize}
                totalPages={totalPages}
                search={search}
                onSearchChange={handleSearchChange}
                sortOrder={sortOrder}
                onSortOrderChange={handleSortOrderChange}
                onPageChange={setPage}
                currentUserRole={currentUser?.role || undefined}
                currentUserId={currentUser?.id}
                onOpenInvite={() => setIsInviteOpen(true)}
                onOpenTransferOwnership={() => {
                    setSelectedMember(null)
                    setIsTransferOwnershipOpen(true)
                }}
                onEditRole={handleEditRole}
                onEditScopes={handleEditScopes}
                onToggleStatus={handleToggleStatus}
                onRemoveMember={handleRemoveMember}
                onTransferOwnership={handleTransferOwnership}
                onRevokeInvitation={handleRevokeInvitation}
            />

            <InviteModal open={isInviteOpen} onOpenChange={setIsInviteOpen} onSuccess={fetchData} />
            <EditUserRoleModal open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen} member={selectedMember} onSuccess={fetchData} />
            <EditUserScopesModal open={isEditScopesOpen} onOpenChange={setIsEditScopesOpen} member={selectedMember} onSuccess={fetchData} />
            <ToggleUserStatusModal open={isToggleStatusOpen} onOpenChange={setIsToggleStatusOpen} member={selectedMember} currentUser2FA={currentUser?.is_2fa_enabled || false} onSuccess={fetchData} />
            <RemoveUserModal open={isRemoveOpen} onOpenChange={setIsRemoveOpen} member={selectedMember} currentUser2FA={currentUser?.is_2fa_enabled || false} onSuccess={fetchData} />
            <TransferOwnershipModal open={isTransferOwnershipOpen} onOpenChange={setIsTransferOwnershipOpen} members={members} selectedTargetMember={selectedMember} currentUser2FA={currentUser?.is_2fa_enabled || false} onSuccess={fetchData}/>
            <RevokeInviteModal open={isRevokeInviteOpen} onOpenChange={setIsRevokeInviteOpen} invitation={selectedInvitation} onSuccess={fetchData} />
            
        </div>
    )
}

export default TenantUsersPage
