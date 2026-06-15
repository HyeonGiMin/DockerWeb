import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'
import styles from './form.module.css'

export const formStyles = styles

interface FieldProps {
  label: string
  hint?: string
  children: (id: string) => ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  const id = useId()
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function TextInput({ className, ...rest }: InputProps) {
  return <input className={`${styles.control} ${className ?? ''}`} {...rest} />
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, children, ...rest }: SelectProps) {
  return (
    <select className={`${styles.control} ${className ?? ''}`} {...rest}>
      {children}
    </select>
  )
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextArea({ className, ...rest }: TextAreaProps) {
  return (
    <textarea className={`${styles.control} ${className ?? ''}`} {...rest} />
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  const id = useId()
  return (
    <div className={styles.checkboxRow}>
      <input
        id={id}
        type="checkbox"
        className={styles.checkbox}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id} className={styles.checkboxLabel}>
        {label}
      </label>
    </div>
  )
}
