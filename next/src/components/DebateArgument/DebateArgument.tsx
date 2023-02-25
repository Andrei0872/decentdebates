import { Button, Icon, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { Classes, Popover2 } from '@blueprintjs/popover2';
import styles from './DebateArgument.module.scss';
import '@blueprintjs/popover2/src/blueprint-popover2.scss'

export enum ArgumentType {
  PRO = 'PRO',
  CON = 'CON',
}

export interface DebateArgumentData {
  argumentId: number;
  debateId: number;
  debateTitle: string;
  ticketId: number;
  title: string;
  content: string;
  createdById: number;
  argumentType: ArgumentType;
  createdAt: string;
  username: string;
}

interface Props {
  debateArgumentData: DebateArgumentData;

  readArgument: (argId: number | null) => void;
  isExpanded: boolean;
  additionalActions: JSX.Element;
}

function DebateArgument(props: Props) {
  const { debateArgumentData, isExpanded } = props;

  return (
    <div className={styles.argument}>
      <div className={styles.header}>
        <h3>{debateArgumentData.title}</h3>
        <div className={styles.actions}>
          <Popover2
            interactionKind="click"
            // popoverClassName={Classes.POPOVER2_CONTENT_SIZING}
            placement="right"
            usePortal={true}
            content={props.additionalActions}
            renderTarget={({ isOpen, ref, ...targetProps }) => (
              <span {...targetProps} ref={ref}>
                <Icon icon="more" />
              </span>
            )}
          />
        </div>
      </div>

      <div className={styles.body}>
        {debateArgumentData.content}
      </div>

      <div className={styles.footer}>
        <div className={styles.username}>
          {debateArgumentData.username}
        </div>

        <div className={styles.expand}>
          {
            !isExpanded ? (
              <button onClick={() => props.readArgument(debateArgumentData.argumentId)} type='button'>Read more</button>
            ) : (
              <button onClick={() => props.readArgument(null)} type='button'>Collapse</button>
            )
          }
        </div>
      </div>
    </div>
  )
}

export default DebateArgument