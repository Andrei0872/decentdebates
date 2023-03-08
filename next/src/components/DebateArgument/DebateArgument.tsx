import { Button, Icon, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { Classes, Popover2 } from '@blueprintjs/popover2';
import styles from './DebateArgument.module.scss';
import '@blueprintjs/popover2/src/blueprint-popover2.scss'
import { DebateArgument } from '@/store/slices/debates.slice';
import ArgumentEditor from '../ArgumentEditor/ArgumentEditor';

interface Props {
  debateArgumentData: DebateArgument;

  readArgument?: (argId: number | null) => void;
  isExpanded?: boolean;
  additionalActions?: JSX.Element;
}

function DebateArgument(props: Props) {
  const {
    debateArgumentData,
    isExpanded,
    additionalActions,
    readArgument
  } = props;

  const isAbleToExpand = !!readArgument;

  return (
    <div className={styles.argument}>
      <div className={styles.header}>
        <h3>{debateArgumentData.title}</h3>
        {
          additionalActions ? (
            <div className={styles.actions}>
              <Popover2
                interactionKind="click"
                placement="right"
                usePortal={false}
                content={additionalActions}
                renderTarget={({ isOpen, ref, ...targetProps }) => (
                  <span {...targetProps} ref={ref}>
                    <Icon icon="more" />
                  </span>
                )}
              />
            </div>
          ) : null
        }
      </div>

      {
        isExpanded ? (
          <div className={styles.body}>
            <ArgumentEditor containerClassName={styles.argumentEditorContainer} configOptions={{ editable: false, editorState: debateArgumentData.content }} />
          </div>
        ) : null
      }

      <div className={styles.footer}>
        <div className={styles.username}>
          {debateArgumentData.username}
        </div>

        {
          isAbleToExpand ? (
            <div className={styles.expand}>
              {
                !isExpanded ? (
                  <button onClick={() => readArgument(debateArgumentData.argumentId)} type='button'>Read more</button>
                ) : (
                  <button onClick={() => readArgument(null)} type='button'>Collapse</button>
                )
              }
            </div>
          ) : null
        }
      </div>
    </div>
  )
}

export default DebateArgument