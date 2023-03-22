import { Comment as IComment } from '@/types/comment';
import { ForwardedRef, forwardRef, ReactNode, useImperativeHandle, useRef } from 'react';
import ExportContentPlugin, { ExportContentRefData } from '../RichEditor/plugins/ExportContentPlugin';
import RichEditor from '../RichEditor/RichEditor';
import styles from './Comment.module.scss'
import { $getRoot } from 'lexical'

interface Props {
  commentData?: IComment;
  isEditable?: boolean;

  renderHeader?: () => ReactNode;
}

function CommentPlaceholder() {
  return <div className={styles.placeholder}>Add your comment here...</div>;
}

export interface CommentRef {
  getContent: () => string;
  clearContent: () => void;
}

function Comment(props: Props, ref: ForwardedRef<CommentRef>) {
  const { commentData } = props;

  const exportEditorContentRef = useRef<ExportContentRefData>(null);

  useImperativeHandle(
    ref,
    () => ({
      getContent,
      clearContent,
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

  const clearContent = () => {
    const editor = exportEditorContentRef.current?.getEditor();
    if (!editor) {
      return;
    }

    editor.update(() => {
      $getRoot().clear();
    });
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
          configOptions={{ editable: isEditable, editorState: commentData?.content }}
          {...isEditable && { additionalPlugins: <ExportContentPlugin ref={exportEditorContentRef} /> } }
        />
      </div>
    </div>
  )
}

export default forwardRef(Comment);
