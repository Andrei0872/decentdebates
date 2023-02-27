import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ForwardedRef, forwardRef, RefObject, useImperativeHandle } from 'react';
import { SerializedEditor } from 'lexical/LexicalEditor';

export interface ExportContentRefData {
  getEditorContent: () => SerializedEditor;
}

function ExportContentPlugin(props: any, ref: ForwardedRef<ExportContentRefData>) {
  const [editor] = useLexicalComposerContext();
  
  const getEditorContent = () => {
    return editor.toJSON();
  }

  useImperativeHandle(
    ref,
    () => ({
      getEditorContent,
    }),
    [],
  )

  return null;
}

export default forwardRef(ExportContentPlugin);