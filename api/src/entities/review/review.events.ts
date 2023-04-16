import { LinkNode } from "@lexical/link";
import { $createTextNode, $createParagraphNode } from "lexical";
import { richEditor } from "src/utils/rich-editor";
import { NotificationEvent } from "../notification/notificatin.model";
import { UserCookieData } from "../user/user.model";

export class DebateReviewNewComment implements NotificationEvent {
  constructor(
    public readonly ticketId: number,
    public readonly commentId: number,
    public readonly user: UserCookieData,
    public readonly debateTitle: string,
    public readonly recipientId: number,
  ) { }

  static EVENT_NAME = 'debate.review.comment:created';

  getContent(): Promise<string> {
    return richEditor.insertNodes(() => {
      const usernameText = $createTextNode(this.user.username);
      usernameText.setFormat('bold');

      const debateTitleText = $createTextNode(this.debateTitle);
      debateTitleText.setFormat('italic');
      const linkHref = new LinkNode(`/review/debate/${this.ticketId}`);
      linkHref.append(debateTitleText);

      const p = $createParagraphNode();
      p.append(
        usernameText,
        $createTextNode(' added a comment on '),
        linkHref,
      );

      return [p];
    }).getContent();
  }

  getTitle(): string {
    return 'New comment!';
  }
}