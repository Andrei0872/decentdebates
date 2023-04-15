import { LinkNode } from "@lexical/link";
import { $createParagraphNode, $createTextNode, $insertNodes, createEditor } from "lexical";
import { config } from 'src/config';
import { richEditor } from "src/utils/rich-editor";

export class DebateTicketCreated {
  constructor(
    public readonly ticketId: number,
    public readonly debateTitle: string,
  ) { }

  static EVENT_NAME = 'debate.ticket:created';

  public getContent(): Promise<string> {
    return richEditor.insertNodes(() => {
      const debateTitleText = $createTextNode(this.debateTitle);
      debateTitleText.setFormat('italic');

      const linkHref = new LinkNode(`/activity`);
      const linkText = $createTextNode(' here');
      linkHref.append(linkText);

      const p = $createParagraphNode();
      p.append(
        $createTextNode('Find the ticket of '),
        debateTitleText,
        linkHref
      );

      return [p];
    }).getContent();
  }

  public getTitle() {
    return 'New proposed debate!';
  }
}