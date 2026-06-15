import type { ReactNode } from 'react'
import styles from './table.module.css'

export const tableStyles = styles

interface TableProps {
  headers: ReactNode[]
  children: ReactNode
  clickable?: boolean
}

export function Table({ headers, children, clickable = false }: TableProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.scroll}>
        <table className={`${styles.table} ${clickable ? styles.clickable : ''}`}>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}
