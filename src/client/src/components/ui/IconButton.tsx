import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './ui.module.css'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  danger?: boolean
  children: ReactNode
}

export function IconButton({
  label,
  danger = false,
  children,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classes = [
    styles.iconBtn,
    danger ? styles.iconBtnDanger : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      title={label}
      aria-label={label}
      {...rest}
    >
      {children}
    </button>
  )
}
