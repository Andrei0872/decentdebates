import { ReactNode } from 'react'
import styles from './CommentsLayout.module.scss'

interface Props {
  mainContent: ReactNode;
  children: ReactNode;
}

interface CommentsListProps {
  children: ReactNode;
}
function CommentsList(props: CommentsListProps) {
  return (
    <ul className={styles.commentsList}>
      {props.children}
    </ul>
  )
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

        {children}
      </section>
    </div>
  )
}

CommentsLayout.CommentsList = CommentsList;

export default CommentsLayout