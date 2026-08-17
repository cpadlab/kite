import * as z from 'zod'
import i18n from 'i18next'

export const loginSchema = z.object({
    identifier: z.string()
        .min(3, { message: i18n.t('pages.public.login.errors.identifier_min') })
        .max(255, { message: i18n.t('pages.public.login.errors.identifier_max') }),
    password: z.string()
        .min(8, { message: i18n.t('pages.public.login.errors.password_min') })
        .max(128, { message: i18n.t('pages.public.login.errors.password_max') }),
})

export type LoginSchemaType = z.infer<typeof loginSchema>
