import CommentsLayout from '@/components/Comments/CommentsLayout';
import Layout from '@/components/Layout/Layout';
import { selectCurrentUser, setCurrentUser } from '@/store/slices/user.slice';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';

import styles from '@/styles/ReviewArgument.module.scss';
import Comment from '@/components/Comments/Comment';
import { Callout } from '@blueprintjs/core';
import { fetchArgumentAsModerator } from '@/utils/api/review';
import { ArgumentAsModerator, ReviewItemType } from '@/types/review';
import RichEditor from '@/components/RichEditor/RichEditor';
import { DebateArgument } from '@/store/slices/debates.slice';
import { fetchArgument } from '@/utils/api/debate';

const comments = [...new Array(3)];

interface ArgumentContentProps {
  argumentData: ArgumentAsModerator;

  counterargumentClick: () => void;
}
function ModeratorArgumentContent(props: ArgumentContentProps) {
  const { argumentData } = props;

  return (
    <div>
      <Callout className={styles.debateInfo}>
        <div className={styles.debateTitleContainer}>
          <i className={styles.debateIcon}></i>
          <h3>{argumentData.debateTitle}</h3>
        </div>
      </Callout>

      <div className={styles.argContainer}>
        <h2 className={styles.argTitle}>{argumentData.argumentTitle}</h2>

        <div className={styles.argInfo}>
          <div className={styles.argType}>{argumentData.argumentType}</div>

          {
            argumentData.counterargumentToId ? (
              <div className={styles.counterargumentTitle}>
                Counterargument to <span onClick={props.counterargumentClick}>{argumentData.counterargumentToTitle}</span>
              </div>
            ) : null
          }
        </div>

        <div className={styles.argContent}>
          <RichEditor
            containerClassName={styles.argumentEditor}
            configOptions={{ editable: false, editorState: argumentData.argumentContent }}
          />
        </div>
      </div>
    </div>
  );
}

const RIGHT_PANEL_WIDTH = 300;

function Argument() {
  const router = useRouter()
  const { id: ticketId } = router.query

  const dispatch = useAppDispatch();

  const user = useAppSelector(selectCurrentUser);

  const [shouldDisplayRightPanel, setShouldDisplayRightPanel] = useState(false)
  const [argument, setArgument] = useState<ArgumentAsModerator | null>(null);
  const [counterargument, setCounterargument] = useState<DebateArgument | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    fetchArgumentAsModerator((ticketId as string))
      .then(arg => setArgument(arg))
      .catch(() => {
        router.push('/');
        dispatch(setCurrentUser(null));
      });
  }, [router.isReady]);

  const redirectBack = () => {
    router.back();
  }

  const addComment = () => {
    console.log('Adding comment.');
  }

  const showRightPanel = () => {
    setShouldDisplayRightPanel(!shouldDisplayRightPanel);
  }

  const onCounterargumentClick = () => {
    if (!argument) {
      return;
    }

    // TODO: might want to add a loading indicator.

    setShouldDisplayRightPanel(!shouldDisplayRightPanel);

    if (counterargument) {
      return;
    }

    fetchArgument(argument.debateId, argument.counterargumentToId)
      .then(counterarg => setCounterargument(counterarg));
  }

  return (
    <Layout>
      <div className={styles.panelsContainer}>
        <div style={{ width: shouldDisplayRightPanel ? `${window.innerWidth - RIGHT_PANEL_WIDTH}px` : '100%' }} className={styles.leftPanel}>
          <section className={styles.buttons}>
            <button onClick={redirectBack} type='button'>Back</button>
          </section>

          <CommentsLayout
            mainContent={
              argument?.reviewItemType === ReviewItemType.MODERATOR
                ? <ModeratorArgumentContent counterargumentClick={onCounterargumentClick} argumentData={argument} />
                : null
            }
          >
            <CommentsLayout.CommentsList>
              {
                comments.map(c => (
                  <Comment isEditable={false} />
                ))
              }
              <Comment isEditable={true} />
            </CommentsLayout.CommentsList>

            <div className={styles.commentButtons}>
              <button type='button' onClick={addComment}>Add Comment</button>
            </div>

          </CommentsLayout>
        </div>

        <div className={`${styles.rightPanel} ${shouldDisplayRightPanel ? styles.isVisible : ''}`}>
          {
            shouldDisplayRightPanel && !!counterargument ? (
              <>
                <h2 className={styles.counterargumentTitle}>{counterargument.title}</h2>
                <div className={styles.counterargumentEditorContainer}>
                  <RichEditor
                    containerClassName={styles.counterargumentEditor}
                    configOptions={{ editable: false, editorState: counterargument.content }}
                  />
                </div>
              </>
            ) : null
          }
        </div>
      </div>
    </Layout>
  )
}

export default Argument;