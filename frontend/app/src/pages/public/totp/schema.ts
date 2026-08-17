import * as z from 'zod'
import i18n from 'i18next'

export const totpSchema = z.object({
    code: z.string()
        .length(6, { message: i18n.t('pages.public.totp.errors.code_length', 'The code must be exactly 6 digits.') }),
})

export type TotpSchemaType = z.infer<typeof totpSchema>
