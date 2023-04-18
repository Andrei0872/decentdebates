import { LinkNode } from "@lexical/link";
import { $createParagraphNode, $createTextNode, $insertNodes, createEditor } from "lexical";
import { config } from 'src/config';
import { richEditor } from "src/utils/rich-editor";
import { NotificationEvent } from "../notification/notificatin.model";
import { UserCookieData } from "../user/user.model";

export class DebateTicketCreated implements NotificationEvent {
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


export class ArgumentTicketCreated implements NotificationEvent {
  constructor(
    public readonly ticketId: number,
    public readonly argumentTitle: string,
  ) { }

  static EVENT_NAME = 'argument.ticket:created';

  getContent(): Promise<string> {
    return richEditor.insertNodes(() => {
      const argumentTitleText = $createTextNode(this.argumentTitle);
      argumentTitleText.setFormat('italic');

      const linkHref = new LinkNode(`/activity`);
      const linkText = $createTextNode(' here');
      linkHref.append(linkText);

      const p = $createParagraphNode();
      p.append(
        $createTextNode('Find the ticket of '),
        argumentTitleText,
        linkHref
      );

      return [p];
    }).getContent();
  }

  getTitle(): string {
    return 'New argument proposed!';
  }
}


export class DebateTitleUpdated implements NotificationEvent {
  constructor(
    public readonly ticketId: number,
    public readonly user: UserCookieData,
    public readonly oldTitle: string,
    public readonly newTitle: string,
    public readonly recipientId: number,
  ) { }

  static EVENT_NAME = 'debate/title:update';

  getContent(): Promise<string> {
    // 'X changed the title from Y to Z'.
    return richEditor.insertNodes(() => {
      const usernameText = $createTextNode(this.user.username);
      usernameText.setFormat('bold');

      const oldTitleText = $createTextNode(this.oldTitle);
      oldTitleText.setFormat('strikethrough');

      const debateTitleText = $createTextNode(this.newTitle);
      debateTitleText.setFormat('italic');
      const linkHref = new LinkNode(`/review/debate/${this.ticketId}`);
      linkHref.append(debateTitleText);

      const p = $createParagraphNode();
      p.append(
        usernameText,
        $createTextNode(' changed the title from '),
        oldTitleText,
        $createTextNode(' to '),
        linkHref,
        $createTextNode('.'),
      );

      return [p];
    }).getContent();
  }

  getTitle(): string {
    return 'Debate updated!'
  }
}

export class ArgumentUpdated implements NotificationEvent {
  constructor(
    public readonly ticketId: number,
    public readonly user: UserCookieData,
    public readonly debateTitle: string,
    public readonly argumentTitle: string,
    public readonly recipientId: number,
  ) { }

  static EVENT_NAME = 'argument:update';

  getContent(): Promise<string> {
    // 'X updated Y in the debate entitled Z'.
    return richEditor.insertNodes(() => {
      const usernameText = $createTextNode(this.user.username);
      usernameText.setFormat('bold');

      const debateTitle = $createTextNode(this.debateTitle);
      debateTitle.setFormat('italic');

      const argumentTitleText = $createTextNode(this.argumentTitle);
      argumentTitleText.setFormat('italic');
      const linkHref = new LinkNode(`/review/argument/${this.ticketId}`);
      linkHref.append(argumentTitleText);

      const p = $createParagraphNode();
      p.append(
        usernameText,
        $createTextNode(' updated '),
        linkHref,
        $createTextNode(' in the debate entitled '),
        debateTitle,
        $createTextNode('.'),
      );

      return [p];
    }).getContent();
  }

  getTitle(): string {
    return 'Argument updated!'
  }
}

export class DebateTicketApproved implements NotificationEvent {
  constructor(
    public readonly ticketId: number,
    public readonly debateId: number,
    public readonly debateTitle: string,
    public readonly recipientId: number,
    public readonly senderId: number,
  ) { }

  static EVENT_NAME = 'debate/ticket:approved';

  getContent(): Promise<string> {
    return richEditor.insertNodes(() => {
      const debateTitleText = $createTextNode(this.debateTitle);
      debateTitleText.setFormat('italic');
      const linkHref = new LinkNode(`/debates/${this.debateId}`);
      linkHref.append(debateTitleText);

      const p = $createParagraphNode();
      p.append(
        linkHref,
        $createTextNode(' has been published!'),
      );

      return [p];
    }).getContent();
  }

  getTitle(): string {
    return 'Debate published!';
  }
}

export class ArgumentTicketApproved implements NotificationEvent {
  constructor(
    public readonly ticketId: number,
    public readonly debateId: number,
    public readonly debateTitle: string,
    public readonly argumentId: number,
    public readonly argumentTitle: string,
    public readonly recipientId: number,
    public readonly senderId: number,
  ) { }

  static EVENT_NAME = 'argument/ticket:approved';

  getContent(): Promise<string> {
    // 'The argument X has been published in Y'.
    return richEditor.insertNodes(() => {
      const argumentTitleText = $createTextNode(this.argumentTitle);
      argumentTitleText.setFormat('italic');
      
      const debateTitleText = $createTextNode(this.debateTitle);
      debateTitleText.setFormat('italic');
      const linkHref = new LinkNode(`/debates/${this.debateId}`);
      linkHref.append(debateTitleText);

      const p = $createParagraphNode();
      p.append(
        $createTextNode('The argument '),
        argumentTitleText,
        $createTextNode(' has been published in '),
        linkHref,
      );

      return [p];
    }).getContent();
  }

  getTitle(): string {
    return 'Argument published!';
  }
}