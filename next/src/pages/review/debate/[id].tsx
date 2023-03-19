import Comment from '@/components/Comments/Comment';
import CommentsLayout from '@/components/Comments/CommentsLayout';
import Layout from '@/components/Layout/Layout';
import { selectPreviewedCard } from '@/store/slices/moderator.slice';
import { setCurrentUser } from '@/store/slices/user.slice';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { useRouter } from 'next/router'
import { useEffect } from 'react';

import styles from '@/styles/ReviewDebate.module.scss'

const comments = [...new Array(3)];

function DebateContent() {
  return (
    <div className={styles.debateContent}>
      <h1>Debate title</h1>
      <div className={styles.addedBy}>Added by: <span>username.here</span></div>
    </div>
  )
}

function Debate() {
  const router = useRouter()
  const { id } = router.query

  // console.log(id, router.isReady);

  const previewedCard = useAppSelector(selectPreviewedCard);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!previewedCard) {
      router.push('/');
      dispatch(setCurrentUser(null));
    }
  }, []);

  const redirectBack = () => {
    router.back();
  }

  const addComment = () => {
    console.log('Adding comment.');
  }

  return (
    <Layout>
      <section className={styles.buttons}>
        <button onClick={redirectBack} type='button'>Back</button>
      </section>

      <CommentsLayout mainContent={<DebateContent />}>
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
    </Layout>
  )
}

export default Debate;