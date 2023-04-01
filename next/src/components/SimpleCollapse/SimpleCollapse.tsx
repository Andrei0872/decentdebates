import { Icon } from '@blueprintjs/core';
import { ReactNode, useState } from 'react'
import styles from './SimpleCollapse.module.scss'

interface Props {
  header: ReactNode;
  children: ReactNode;
}

function SimpleCollapse(props: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {props.header}

        <button className={styles.triggerButton} onClick={() => setIsOpen(!isOpen)} type='button'>
          <Icon icon={`${isOpen ? "chevron-up" : "chevron-down"}`} />
        </button>
      </div>

      <div
        className={`${styles.body} ${isOpen ? styles.isOpen : ''}`}
      >
        {props.children}
      </div>
    </div>
  )
}

export default SimpleCollapse