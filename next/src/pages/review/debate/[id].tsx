import Comment, { CommentRef } from '@/components/Comments/Comment';
import CommentsLayout from '@/components/Comments/CommentsLayout';
import Layout from '@/components/Layout/Layout';
import { selectPreviewedCard } from '@/store/slices/moderator.slice';
import { selectCurrentUser, setCurrentUser } from '@/store/slices/user.slice';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react';

import styles from '@/styles/ReviewDebate.module.scss'
import { io, Socket } from 'socket.io-client';
import { fetchTicketComments } from '@/utils/api/comment';
import { Comment as IComment } from '@/types/comment';
import { DebateMetadata, fetchDebateMetadata } from '@/utils/api/debate';
import { Popover2 } from '@blueprintjs/popover2';
import { EditableText, Icon, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { EditorState } from 'lexical';

interface DebateContentProps {
  debateMetadata: DebateMetadata;
}

function DebateContent(props: DebateContentProps) {
  const { debateMetadata } = props;

  return (
    <div className={styles.debateContent}>
      <h1>{debateMetadata.title}</h1>
      <div className={styles.addedBy}>Added by: <span>{debateMetadata.username}</span></div>
    </div>
  )
}

let socket: Socket | undefined;
function Debate() {
  const router = useRouter()
  const { id: ticketId } = router.query

  const dispatch = useAppDispatch();

  const user = useAppSelector(selectCurrentUser);

  const [comments, setComments] = useState<IComment[]>([]);
  const [debateMetadata, setDebateMetadata] = useState<DebateMetadata | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);

  const editableCommentRef = useRef<CommentRef | null>(null);

  useEffect(() => {
    if (!router.isReady) {
      return () => { };
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

    socket.on('comment/debate:create', (data: any) => {
      const { insertedComment } = data;
      if (!insertedComment) {
        return;
      }

      editableCommentRef.current?.clearContent();
      setComments(comments => [...comments, insertedComment]);
    })

    socket.connect();
    return () => {
      socket?.disconnect();
      socket = undefined;
    }
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady) {
      return () => { };
    }

    fetchDebateMetadata((ticketId as string))
      .then(r => setDebateMetadata(r.debateMetadata))
      .catch(err => {
        console.log(err.response.statusText);
        router.push('/');
        dispatch(setCurrentUser(null));
      })
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    fetchTicketComments((ticketId as string))
      .then(comments => {
        setComments(comments);
      })
  }, [router.isReady]);

  useEffect(() => {
    if (editingCommentId) {
      editableCommentRef.current?.getEditor()?.setEditable(true);
    }
  }, [editingCommentId]);

  const redirectBack = () => {
    router.back();
  }

  const addComment = () => {
    console.log('Adding comment.');

    const comment = editableCommentRef.current?.getContent();
    if (!comment) {
      // TODO: some validation + informational message.
      return;
    }

    socket?.emit('comment/debate:create', { comment });
  }

  const startEditingComment = (comment: IComment) => {
    setEditingCommentId(comment.commentId);
  }

  return (
    <Layout>
      <section className={styles.buttons}>
        <button onClick={redirectBack} type='button'>Back</button>
      </section>

      <CommentsLayout mainContent={debateMetadata ? <DebateContent debateMetadata={debateMetadata} /> : <p>Loading...</p>}>
        <CommentsLayout.CommentsList>
          {
            comments.map(c => (
              <div>
                <Comment
                  key={c.commentId}
                  commentData={c}
                  isEditable={c.commentId === editingCommentId}
                  ref={r => {
                    if (c.commentId === editingCommentId) {
                      editableCommentRef.current = r;
                    }
                  }}
                  renderHeader={() => {
                    if (c.commentId === editingCommentId) {
                      return null;
                    }

                    return (
                      <>
                        <div className={user?.id === c.commenterId ? styles.isOwnComment : undefined}>{c.commenterUsername}</div>
                        <div>{c.createdAt}</div>
                        <div>Edited</div>

                        <div className={styles.commentActionsContainer}>
                          <Popover2
                            interactionKind="click"
                            placement="right"
                            usePortal={false}
                            content={
                              <Menu className={styles.commentActions} key="menu">
                                <MenuItem onClick={() => startEditingComment(c)} icon="edit" text="Edit comment" />
                              </Menu>
                            }
                            renderTarget={({ isOpen, ref, ...targetProps }) => (
                              <span {...targetProps} ref={ref}>
                                <Icon className={styles.commentActionsIcon} icon="more" />
                              </span>
                            )}
                          />
                        </div>
                      </>
                    )
                  }}
                />

              </div>
            ))
          }
          <Comment
            ref={r => {
              if (!editingCommentId) {
                editableCommentRef.current = r;
              }
            }}
            isEditable={true}
          />
        </CommentsLayout.CommentsList>

        <div className={styles.commentButtons}>
          <button disabled={!!editingCommentId} type='button' onClick={addComment}>Add Comment</button>
        </div>
      </CommentsLayout>
    </Layout>
  )
}

export default Debate;