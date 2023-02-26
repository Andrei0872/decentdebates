import styles from './ArgumentEditor.module.scss';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { editorConfig } from './config';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

function Placeholder() {
  return <div className={styles.placeholder}>Describe your argument here...</div>;
}

function ArgumentEditor() {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className={styles.container}>
        <ToolbarPlugin />
        <div className={styles.inner}>
          <RichTextPlugin
            contentEditable={<ContentEditable className={styles.input} />}
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <AutoFocusPlugin />
          <ListPlugin />
          <HistoryPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} /> 
        </div>
      </div>
    </LexicalComposer>
  )
}

export default ArgumentEditor