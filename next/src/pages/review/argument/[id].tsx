import CommentsLayout from '@/components/Comments/CommentsLayout';
import Layout from '@/components/Layout/Layout';
import { selectPreviewedCard } from '@/store/slices/moderator.slice';
import { setCurrentUser } from '@/store/slices/user.slice';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';

import styles from '@/styles/ReviewArgument.module.scss';
import Comment from '@/components/Comments/Comment';
import { Callout } from '@blueprintjs/core';

const comments = [...new Array(3)];

function ArgumentContent() {
  return (
    <div>
      <Callout className={styles.debateInfo}>
        <div className={styles.debateTitleContainer}>
          <i className={styles.debateIcon}></i>
          <h3>Debate title</h3>
        </div>
      </Callout>

      <div className={styles.argContainer}>
        <h2 className={styles.argTitle}>Arg title</h2>

        <div className={styles.argInfo}>
          <div className={styles.argType}>CON</div>

          <div>
            Counterargument to <span>Counterargument title</span>
          </div>
        </div>

        <div className={styles.argContent}>
          arg content
        </div>
      </div>
    </div>
  );
}

const RIGHT_PANEL_WIDTH = 300;

function Argument() {
  const router = useRouter()
  const { id } = router.query

  const previewedCard = useAppSelector(selectPreviewedCard);
  const dispatch = useAppDispatch();

  const [shouldDisplayRightPanel, setShouldDisplayRightPanel] = useState(false)

  console.log(previewedCard);

  useEffect(() => {
    // if (!previewedCard) {
    //   router.push('/');
    //   dispatch(setCurrentUser(null));
    // }
  }, []);

  const redirectBack = () => {
    router.back();
  }

  const addComment = () => {
    console.log('Adding comment.');
  }

  const showRightPanel = () => {
    setShouldDisplayRightPanel(!shouldDisplayRightPanel);
  }

  return (
    <Layout>
      <div className={styles.panelsContainer}>
        <div style={{ width: shouldDisplayRightPanel ? `${window.innerWidth - RIGHT_PANEL_WIDTH}px` : '100%' }} className={styles.leftPanel}>
          <button onClick={() => showRightPanel()}>test</button>

          <section className={styles.buttons}>
            <button onClick={redirectBack} type='button'>Back</button>
          </section>

          <CommentsLayout mainContent={<ArgumentContent />}>
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
            shouldDisplayRightPanel ? (
              <>
                <h2>test</h2>
                <p>content</p>
              </>
            ) : null
          }
        </div>
      </div>
    </Layout>
  )
}

export default Argument;