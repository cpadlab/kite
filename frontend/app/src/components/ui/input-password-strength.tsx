import React, { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { EyeOffIcon, EyeIcon, CheckIcon, XIcon } from 'lucide-react'

export interface InputPasswordStrengthProps {
    id?: string
    name?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    disabled?: boolean
    placeholder?: string
    label?: string
    error?: string
    className?: string
}

export const InputPasswordStrength: React.FC<InputPasswordStrengthProps> = ({
    id: externalId,
    name,
    value = '',
    onChange,
    onBlur,
    disabled = false,
    placeholder,
    label,
    error,
    className,
}) => {

    const { t } = useTranslation()
    const generatedId = useId()
    const id = externalId || generatedId
    const [isVisible, setIsVisible] = useState(false)

    const toggleVisibility = () => setIsVisible((prev) => !prev)

    const requirements = useMemo(
        () => [
            {
                regex: /.{8,}/,
                text: t('components.password_strength.min_8_chars', 'Al menos 8 caracteres'),
            },
            {
                regex: /[a-z]/,
                text: t('components.password_strength.min_lowercase', 'Al menos 1 letra minúscula'),
            },
            {
                regex: /[A-Z]/,
                text: t('components.password_strength.min_uppercase', 'Al menos 1 letra mayúscula'),
            },
            {
                regex: /[0-9]/,
                text: t('components.password_strength.min_number', 'Al menos 1 número'),
            },
            {
                regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/,
                text: t('components.password_strength.min_special', 'Al menos 1 carácter especial'),
            },
        ],
        [t]
    )

    const strength = useMemo(() => {
        return requirements.map((req) => ({
            met: req.regex.test(value),
            text: req.text,
        }))
    }, [requirements, value])

    const strengthScore = useMemo(() => {
        return strength.filter((req) => req.met).length
    }, [strength])

    const getColor = (score: number) => {
        if (score === 0) return 'bg-border'
        if (score <= 1) return 'bg-destructive'
        if (score <= 2) return 'bg-orange-500'
        if (score <= 3) return 'bg-amber-500'
        if (score === 4) return 'bg-yellow-400'
        return 'bg-green-500'
    }

    const getText = (score: number) => {
        if (score === 0) return t('components.password_strength.enter_password', 'Introduce una contraseña')
        if (score <= 2) return t('components.password_strength.weak', 'Contraseña débil')
        if (score <= 3) return t('components.password_strength.medium', 'Contraseña media')
        if (score === 4) return t('components.password_strength.strong', 'Contraseña fuerte')
        return t('components.password_strength.very_strong', 'Contraseña muy fuerte')
    }

    return (
        <div className={cn('w-full space-y-2', className)}>
            
            {label && <Label htmlFor={id}>{label}</Label>}

            <InputGroup className="relative mb-2">
                <InputGroupInput id={id} name={name} type={isVisible ? 'text' : 'password'} placeholder={placeholder || t('components.password_strength.placeholder', 'Contraseña')} value={value} onChange={onChange} onBlur={onBlur} disabled={disabled} />
                <InputGroupAddon align="inline-end">
                    <Button type="button" variant="ghost" size="icon" onClick={toggleVisibility} disabled={disabled} className="text-muted-foreground hover:bg-transparent cursor-pointer">
                        {isVisible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                        <span className="sr-only">
                            {isVisible
                                ? t('components.password_strength.hide', 'Ocultar contraseña')
                                : t('components.password_strength.show', 'Mostrar contraseña')}
                        </span>
                    </Button>
                </InputGroupAddon>
            </InputGroup>

            {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}

            <div className="mb-3 flex h-1 w-full gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index} className={cn( 'h-full flex-1 rounded-full transition-all duration-500 ease-out', index < strengthScore ? getColor(strengthScore) : 'bg-border' )}/>
                ))}
            </div>

            <p className="text-foreground text-xs font-medium">
                {getText(strengthScore)}. {t('components.password_strength.must_contain', 'Debe contener:')}
            </p>

            <ul className="mb-2 space-y-1">
                {strength.map((req, index) => (
                    <li key={index} className="flex items-center gap-2">
                        {req.met ? (<CheckIcon className="size-3.5 text-green-600 dark:text-green-400 shrink-0" />
                        ) : (<XIcon className="text-muted-foreground size-3.5 shrink-0" />)}
                        <span className={cn( 'text-xs',req.met ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground')}>
                            {req.text}
                        </span>
                    </li>
                ))}
            </ul>

        </div>
    )
}

export default InputPasswordStrength
