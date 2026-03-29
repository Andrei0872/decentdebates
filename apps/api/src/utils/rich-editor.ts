import { LinkNode } from "@lexical/link";
import { $getRoot, $insertNodes, createEditor, LexicalNode } from "lexical";

interface NodesFactory {
  (): Array<LexicalNode>;
}

const editor = createEditor({ nodes: [LinkNode], namespace: 'decentdebates' });
editor._headless = true;

const insertNodes = (nodesFactory: NodesFactory) => {
  editor.update(() => {
    const nodes = nodesFactory();
    $insertNodes(nodes);
  });

  return {
    getContent: (): Promise<string> => {
      let resolve;
      const resultPromise = new Promise<string>(r => resolve = r);

      // Based on a quick look into the source code, the node's insertion
      // is achieved via `setTimeout()`.
      setImmediate(() => {
        resolve(JSON.stringify(editor.getEditorState()));
      });

      return resultPromise
        .finally(() => {
          clearEditor();
        });
    }
  }
}

const clearEditor = () => {
  editor.update(() => {
    $getRoot().clear();
  });
}

export const richEditor = {
  insertNodes,
};