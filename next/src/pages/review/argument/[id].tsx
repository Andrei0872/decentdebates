import CommentsLayout from '@/components/Comments/CommentsLayout';
import Layout from '@/components/Layout/Layout';
import { selectPreviewedCard } from '@/store/slices/moderator.slice';
import { setCurrentUser } from '@/store/slices/user.slice';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { useRouter } from 'next/router'
import { useEffect } from 'react';

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

function Argument() {
  const router = useRouter()
  const { id } = router.query

  const previewedCard = useAppSelector(selectPreviewedCard);
  const dispatch = useAppDispatch();

  console.log(previewedCard);

  useEffect(() => {
    if (!previewedCard) {
      router.push('/');
      dispatch(setCurrentUser(null));
    }
  }, []);

  const redirectBack = () => {
    router.back();
  }


  return (
    <Layout>
      <section className={styles.buttons}>
        <button onClick={redirectBack} type='button'>Back</button>
      </section>

      <CommentsLayout mainContent={<ArgumentContent />}>
        {
          comments.map(c => (
            <Comment />
          ))
        }
      </CommentsLayout>
    </Layout>
  )
}

export default Argument;