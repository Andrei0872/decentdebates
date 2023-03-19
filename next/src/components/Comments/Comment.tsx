import RichEditor from '../RichEditor/RichEditor';
import styles from './Comment.module.scss'

interface Props {
  commentData?: {
    authorUsername: string;
    replyToCommentTitle?: string;
    modifiedAt: string;
    createdAt: string;
    rawContent: string;
  }

  isEditable?: boolean;
}

function CommentPlaceholder() {
  return <div className={styles.placeholder}>Add your comment here...</div>;
}

function Comment(props: Props) {
  const { commentData } = props;

  const isEditable = !!props.isEditable;

  return (
    <div className={styles.container}>
      {
        !isEditable ? (
          <div className={styles.header}>
            <div>andrei.gatej</div>
            <div>19.04.2022</div>
            <div>Edited</div>
            
            <div>...</div>
          </div>
        ) : null
      }

      <div className={styles.body}>
        <RichEditor placeholder={<CommentPlaceholder />} containerClassName={styles.commentEditorContainer} configOptions={{ editable: isEditable }} />
      </div>
    </div>
  )
}

export default Comment
