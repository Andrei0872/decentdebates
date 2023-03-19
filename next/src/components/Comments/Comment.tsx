import styles from './Comment.module.scss'

interface Props {
  commentData?: {
    authorUsername: string;
    replyToCommentTitle?: string;
    modifiedAt: string;
    createdAt: string;
    rawContent: string;
  }
}

function Comment(props: Props) {
  const { commentData } = props;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>andrei.gatej</div>
        <div>19.04.2022</div>
        <div>Edited</div>

        <div>...</div>
      </div>

      <div className={styles.body}>
        some content here.
      </div>
    </div>
  )
}

export default Comment
