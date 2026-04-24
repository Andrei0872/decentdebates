import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ForwardedRef, forwardRef, useCallback, useImperativeHandle } from 'react';
import { LexicalEditor } from 'lexical';

export interface ExportContentRefData {
  getEditor: () => LexicalEditor;
}

function ExportContentPlugin(props: any, ref: ForwardedRef<ExportContentRefData>) {
  const [editor] = useLexicalComposerContext();
  
  const getEditor = useCallback(() => {
    return editor;
  }, [editor]);

  useImperativeHandle(
    ref,
    () => ({
      getEditor,
    }),
    [getEditor],
  )

  return null;
}

export default forwardRef(ExportContentPlugin);
