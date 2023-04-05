import { Icon } from '@blueprintjs/core';
import { ReactNode, useState } from 'react'
import styles from './SimpleCollapse.module.scss'

interface Props {
  header: ReactNode;
  children: ReactNode;
  expandOnClick?: boolean;

  click?: () => void;
  expandChange?: (isExpanded: boolean) => void;
}

function SimpleCollapse(props: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const shouldExpandOnClick = props.expandOnClick === true;

  const onContainerClick = () => {
    if (shouldExpandOnClick) {
      setIsOpen(!isOpen);
    }

    props.click?.();
  }

  const handleExpandChange = () => {
    setIsOpen(!isOpen);
    props.expandChange?.(!isOpen);
  }

  return (
    <div onClick={onContainerClick} className={styles.container}>
      <div className={`${styles.header} ${shouldExpandOnClick ? styles.expandOnClick : ''}`}>
        {props.header}

        <button className={styles.triggerButton} onClick={handleExpandChange} type='button'>
          <Icon icon={`${isOpen ? "chevron-up" : "chevron-down"}`} />
        </button>
      </div>

      <div
        className={`${styles.bodyWrapper} ${isOpen ? styles.isOpen : ''}`}
      >
        <div className={styles.body}>
          {props.children}
        </div>
      </div>
    </div>
  )
}

export default SimpleCollapse