import { InitialConfigType } from "@lexical/react/LexicalComposer";
import styles from './ArgumentEditor.module.scss';
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode } from "@lexical/link";

export const editorConfig: InitialConfigType = {
  theme: {
    placeholder: styles.placeholder,
    paragraph: styles.paragraph,
    quote: styles.quote,
    heading: {
      h1: styles.h1,
      h2: styles.h2,
      h3: styles.h3,
      h4: styles.h4,
      h5: styles.h5
    },
    list: {
      nested: {
        listitem: styles.nestedListItem
      },
      ol: styles.ol,
      ul: styles.ul,
      listitem: styles.listItem
    },
    link: styles.link,
    text: {
      bold: styles.textBold,
      italic: styles.textItalic,
      underline: styles.textUnderline,
      strikethrough: styles.textStrikethrough,
    },
  },
  onError(err) {
    throw err;
  },
  namespace: 'decentdebates',
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    LinkNode,
  ],
}