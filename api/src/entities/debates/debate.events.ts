import { LinkNode } from "@lexical/link";
import { $createParagraphNode, $createTextNode, $insertNodes, createEditor } from "lexical";
import { config } from 'src/config';

export class DebateTicketCreated {
  constructor(public readonly ticketId: number) { }

  static EVENT_NAME = 'debate.ticket:created';

  public getContent(): Promise<string> {
    let resolve;
    const resultPromise = new Promise<string>(r => resolve = r);

    const editor = createEditor({ nodes: [LinkNode], namespace: 'decentdebates' });
    editor._headless = true;

    editor.update(() => {
      const txtNode = $createTextNode('You can find the ticket');

      const linkHref = new LinkNode(`/activity`);
      const linkText = $createTextNode(' here');
      linkHref.append(linkText);

      const p = $createParagraphNode();
      p.append(txtNode, linkHref);

      $insertNodes([p]);
    });

    setImmediate(() => {
      console.log(JSON.stringify(editor.getEditorState()));
      resolve(JSON.stringify(editor.getEditorState()));
    });

    return resultPromise;
  }

  public getTitle() {
    return 'New proposed debate';
  }
}