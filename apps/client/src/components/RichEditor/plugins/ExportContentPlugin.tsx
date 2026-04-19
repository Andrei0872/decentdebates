import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ForwardedRef, forwardRef, RefObject, useImperativeHandle } from 'react';
import { LexicalEditor } from 'lexical';

export interface ExportContentRefData {
  getEditor: () => LexicalEditor;
}

function ExportContentPlugin(props: any, ref: ForwardedRef<ExportContentRefData>) {
  const [editor] = useLexicalComposerContext();
  
  const getEditor = () => {
    return editor;
  }

  useImperativeHandle(
    ref,
    () => ({
      getEditor,
    }),
    [],
  )

  return null;
}

export default forwardRef(ExportContentPlugin);
