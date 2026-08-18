import * as z from 'zod'
import i18n from 'i18next'

export const totpSchema = z.object({
    code: z.string().refine(
        (val) => val.trim().length === 6 || val.trim().length === 8,
        { message: i18n.t('pages.public.totp.errors.code_length', 'The code must be 6 digits or an 8-character backup code.') }
    ),
})

export type TotpSchemaType = z.infer<typeof totpSchema>
