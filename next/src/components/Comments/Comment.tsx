import { Comment as IComment } from '@/types/comment';
import { ForwardedRef, forwardRef, ReactNode, useEffect, useImperativeHandle, useRef } from 'react';
import ExportContentPlugin, { ExportContentRefData } from '../RichEditor/plugins/ExportContentPlugin';
import RichEditor from '../RichEditor/RichEditor';
import styles from './Comment.module.scss'
import { $getRoot, LexicalEditor } from 'lexical'

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
  getEditor: () => LexicalEditor | undefined;
}

function Comment(props: Props, ref: ForwardedRef<CommentRef>) {
  const { commentData } = props;

  const isEditable = !!props.isEditable;
  const shouldDisplayHeader = !!props.renderHeader;

  const exportEditorContentRef = useRef<ExportContentRefData>(null);

  useEffect(() => {
    if (!commentData?.content) {
      return;
    }

    const editor = exportEditorContentRef.current?.getEditor();
    editor?.setEditorState(editor.parseEditorState(commentData.content));

  }, [commentData?.content]);

  useImperativeHandle(
    ref,
    () => ({
      getContent,
      clearContent,
      getEditor
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

  const getEditor = () => {
    const editor = exportEditorContentRef.current?.getEditor();
    return editor;
  }

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
          additionalPlugins={<ExportContentPlugin ref={exportEditorContentRef} />}
        />
      </div>
    </div>
  )
}

export default forwardRef(Comment);
