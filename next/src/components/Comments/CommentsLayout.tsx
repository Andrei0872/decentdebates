import { ReactNode } from 'react'
import styles from './CommentsLayout.module.scss'

interface Props {
  mainContent: ReactNode;
  children: ReactNode;
}

function CommentsLayout(props: Props) {
  const { mainContent, children } = props;

  return (
    <div className={styles.container}>
      <section className={styles.mainContent}>
        {mainContent}
      </section>

      <section className={styles.comments}>
        <div className={styles.commentsHeader}>
          <h2>Comments</h2>
        </div>

        <ul className={styles.commentsList}>
          {children}
        </ul>
      </section>
    </div>
  )
}

export default CommentsLayout