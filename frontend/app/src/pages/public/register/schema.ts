import { z } from 'zod'

export const registerSchema = (t: (key: string) => string) =>
    z
        .object({
            password: z
                .string()
                .min(8, t('components.password_strength.min_8_chars'))
                .regex(/[a-z]/, t('components.password_strength.min_lowercase'))
                .regex(/[A-Z]/, t('components.password_strength.min_uppercase'))
                .regex(/[0-9]/, t('components.password_strength.min_number'))
                .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/, t('components.password_strength.min_special')),
            confirm_password: z.string().min(1, t('pages.public.register.errors.password_match')),
        })
        .refine((data) => data.password === data.confirm_password, {
            message: t('pages.public.register.errors.password_match'),
            path: ['confirm_password'],
        })

export type RegisterSchemaType = z.infer<ReturnType<typeof registerSchema>>
