import styles from './RichEditor.module.scss';
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
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
import { ReactNode } from 'react';

function Placeholder() {
  return <div className={styles.placeholder}>Describe your argument here...</div>;
}

interface Props {
  additionalPlugins?: ReactNode;
  configOptions?: Partial<InitialConfigType>;
  containerClassName?: string;
}
function RichEditor(props: Props) {
  const shouldDisplayToolbar = (props.configOptions?.editable ?? true) === true;
  
  return (
    <LexicalComposer initialConfig={{ ...editorConfig, ...props.configOptions }}>
      <div className={`${styles.container} ${props.containerClassName ?? ''}`}>
        {
          shouldDisplayToolbar ? (
            <ToolbarPlugin />
          ) : null
        }
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
          {props.additionalPlugins || null}
        </div>
      </div>
    </LexicalComposer>
  )
}

export default RichEditor