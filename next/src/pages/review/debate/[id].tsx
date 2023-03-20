import Comment from '@/components/Comments/Comment';
import CommentsLayout from '@/components/Comments/CommentsLayout';
import Layout from '@/components/Layout/Layout';
import { selectPreviewedCard } from '@/store/slices/moderator.slice';
import { setCurrentUser } from '@/store/slices/user.slice';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';

import styles from '@/styles/ReviewDebate.module.scss'
import { io, Socket } from 'socket.io-client';

const comments = [...new Array(3)];

function DebateContent() {
  return (
    <div className={styles.debateContent}>
      <h1>Debate title</h1>
      <div className={styles.addedBy}>Added by: <span>username.here</span></div>
    </div>
  )
}

let socket: Socket | undefined;
function Debate() {
  const router = useRouter()
  const { id: ticketId } = router.query

  const previewedCard = useAppSelector(selectPreviewedCard);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!router.isReady) {
      return () => {};
    }

    socket = io('ws://localhost:3002/comments', { autoConnect: false, withCredentials: true, query: { ticketId } });

    socket.on('connect', () => {
      console.log('connect');
      socket?.emit('message', 'foo')
    });

    socket.on('error', err => {
      if (err.reason === 'Unauthenticated') {
        router.push('/');
      }
    });

    socket.on('disconnect', () => {
      console.log('disc');
    })

    socket.on('comment:create', (data: any) => {
      console.log({ data });
    })

    socket.connect();
    return () => {
      socket?.disconnect();
      socket = undefined;
    }
  }, [router.isReady]);

  useEffect(() => {
    // TODO: fetch on the fly so that auth(user & moderator) can be done at the same time.
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

    socket?.emit('comment:create', { comment: 'no comment' }, (data: any) => {
      console.warn(data);
    });
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