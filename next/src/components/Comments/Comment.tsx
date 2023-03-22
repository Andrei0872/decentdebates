import { ForwardedRef, forwardRef, ReactNode, useImperativeHandle, useRef } from 'react';
import ExportContentPlugin, { ExportContentRefData } from '../RichEditor/plugins/ExportContentPlugin';
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

  renderHeader?: () => ReactNode;
}

function CommentPlaceholder() {
  return <div className={styles.placeholder}>Add your comment here...</div>;
}

export interface CommentRef {
  getContent: () => string;
}

function Comment(props: Props, ref: ForwardedRef<CommentRef>) {
  const { commentData } = props;

  const exportEditorContentRef = useRef<ExportContentRefData>(null);

  useImperativeHandle(
    ref,
    () => ({
      getContent
    }),
    []
  );

  const getContent = () => {
    const editor = exportEditorContentRef.current?.getEditor();
    if (!editor) {
      return '';
    }

    return JSON.stringify(editor.getEditorState());
  }

  const isEditable = !!props.isEditable;
  const shouldDisplayHeader = !!props.renderHeader;

  return (
    <div className={styles.container}>
      {
        shouldDisplayHeader ? (
          <div className={styles.header}>
            {props.renderHeader?.()}
          </div>
        ) : null
      }

      <div className={styles.body}>
        <RichEditor
          placeholder={<CommentPlaceholder />}
          containerClassName={styles.commentEditorContainer}
          configOptions={{ editable: isEditable }}
          {...isEditable && { additionalPlugins: <ExportContentPlugin ref={exportEditorContentRef} /> } }
        />
      </div>
    </div>
  )
}

export default forwardRef(Comment);
