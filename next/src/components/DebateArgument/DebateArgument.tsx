import { Button, Icon, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { Classes, Popover2 } from '@blueprintjs/popover2';
import styles from './DebateArgument.module.scss';
import '@blueprintjs/popover2/src/blueprint-popover2.scss'
import { DebateArgument } from '@/store/slices/debates.slice';
import RichEditor from '../RichEditor/RichEditor';
import buttonStyles from '@/styles/shared/button.module.scss';

interface Props {
  debateArgumentData: DebateArgument;

  readArgument?: (argId: number) => void;
  collapseArgument?: (argId: number) => void;
  isExpanded?: boolean;
  additionalActions?: JSX.Element;
}

function DebateArgument(props: Props) {
  const {
    debateArgumentData,
    isExpanded,
    additionalActions,
    readArgument,
    collapseArgument,
  } = props;

  const isAbleToExpand = !!readArgument && !!collapseArgument;

  return (
    <div className={styles.argument}>
      <div className={styles.header}>
        <h3 className={styles.title}>{debateArgumentData.title}</h3>
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
        isExpanded && debateArgumentData.content ? (
          <div className={styles.body}>
            <RichEditor containerClassName={styles.argumentEditorContainer} configOptions={{ editable: false, editorState: debateArgumentData.content }} />
          </div>
        ) : null
      }

      <div className={styles.footer}>
        <div className={styles.username}>
          <Icon icon="person" />
          <span>{debateArgumentData.username}</span>
        </div>

        {
          isAbleToExpand ? (
            <div className={styles.expand}>
              {
                !isExpanded ? (
                  <button
                    onClick={() => readArgument(debateArgumentData.argumentId)}
                    type='button'
                    className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.outlined} ${styles.argButton}`}
                  >
                    Read more
                  </button>
                ) : (
                  <button
                    onClick={() => collapseArgument(debateArgumentData.argumentId)}
                    type='button'
                    className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.outlined} ${styles.argButton}`}
                  >
                    Collapse
                  </button>
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