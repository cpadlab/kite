export interface ScopeAction {
    id: string
    labelKey: string
    descriptionKey?: string
}

export interface ScopeGroup {
    key: string
    labelKey: string
    descriptionKey?: string
    actions: ScopeAction[]
}

export const SYSTEM_SCOPES: ScopeGroup[] = [
    {
        key: 'audit',
        labelKey: 'scopes.audit.title',
        descriptionKey: 'scopes.audit.description',
        actions: [
            {
                id: 'audit:read',
                labelKey: 'scopes.audit.actions.read.label',
                descriptionKey: 'scopes.audit.actions.read.description',
            },
            {
                id: 'audit:write',
                labelKey: 'scopes.audit.actions.write.label',
                descriptionKey: 'scopes.audit.actions.write.description',
            },
        ],
    }
]

export const ALL_SCOPES_FLAT: string[] = SYSTEM_SCOPES.flatMap((group) =>
    group.actions.map((action) => action.id)
)
