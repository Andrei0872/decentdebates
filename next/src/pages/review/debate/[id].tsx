import Comment, { CommentRef } from '@/components/Comments/Comment';
import CommentsLayout from '@/components/Comments/CommentsLayout';
import Layout from '@/components/Layout/Layout';
import { selectPreviewedCard } from '@/store/slices/moderator.slice';
import { selectCurrentUser, setCurrentUser, UserRoles } from '@/store/slices/user.slice';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react';

import styles from '@/styles/ReviewDebate.module.scss'
import { io, Socket } from 'socket.io-client';
import { fetchTicketComments, updateComment } from '@/utils/api/comment';
import { Comment as IComment, UpdateCommentData } from '@/types/comment';
import { Popover2 } from '@blueprintjs/popover2';
import { EditableText, Icon, Intent, Menu, MenuDivider, MenuItem, Position, Toaster } from '@blueprintjs/core';
import { EditorState } from 'lexical';
import { fetchDebateAsModerator, fetchDebateAsUser } from '@/utils/api/review';
import { DebateAsModerator, DebateAsUser, ReviewItemType } from '@/types/review';

interface ModeratorDebateContentProps {
  debateData: DebateAsModerator;
}
function ModeratorDebateContent(props: ModeratorDebateContentProps) {
  const { debateData } = props;

  return (
    <div className={styles.debateContent}>
      <h1>{debateData.title}</h1>
      <div className={styles.addedBy}>Added by: <span>{debateData.username}</span></div>
    </div>
  )
}

interface UserDebateContentProps {
  debateData: DebateAsUser;
}
function UserDebateContent(props: UserDebateContentProps) {
  const { debateData } = props;

  return (
    <div className={styles.debateContent}>
      <h1>{debateData.title}</h1>

      {
        debateData.moderatorId ? (
          <div className={styles.reviewedBy}>Reviewed by: <span>{debateData.moderatorUsername}</span></div>
        ) : null
      }
    </div>
  )
}

const toasterOptions = {
  autoFocus: false,
  canEscapeKeyClear: true,
  position: Position.TOP,
  usePortal: true,
};

let socket: Socket | undefined;
function Debate() {
  const router = useRouter()
  const { id: ticketId } = router.query

  const dispatch = useAppDispatch();

  const user = useAppSelector(selectCurrentUser);

  const [comments, setComments] = useState<IComment[]>([]);
  const [debate, setDebate] = useState<DebateAsModerator | DebateAsUser | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);

  const editableCommentRef = useRef<CommentRef | null>(null);
  const toasterRef = useRef<Toaster>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) {
      return () => { };
    }

    socket = io(`${process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL!}/comments`, { autoConnect: false, withCredentials: true, query: { ticketId } });

    socket.on('connect', () => {
      console.log('connect');
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

    socket.on('comment/debate:update', (data: { updatedComment: UpdateCommentData }) => {
      const { updatedComment } = data;

      setComments(comments => comments.map(
        c => +c.commentId === +updatedComment.commentId
          ? ({ ...c, content: updatedComment.content })
          : c
      ));
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

    if (!user) {
      router.push('/');
    }

    (user!.role === UserRoles.MODERATOR ? fetchDebateAsModerator : fetchDebateAsUser)((ticketId as string))
      .then(r => setDebate(r.debate))
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

  const cancelEditing = (comment: IComment) => {
    const editor = editableCommentRef.current?.getEditor()!;

    editor.setEditable(false);
    editor.setEditorState(editor.parseEditorState(comment.content));

    setEditingCommentId(null);
  }

  const saveCommentEdits = (comment: IComment) => {
    const commentContent = editableCommentRef.current?.getContent()!;
    if (!commentContent) {
      return;
    }

    socket?.emit(
      'comment/debate:update',
      {
        content: commentContent,
        commentId: comment.commentId
      },
      (responseMessage: string) => {
        if (responseMessage === 'OK') {
          setComments(comments => comments.map(
            c => c.commentId === comment.commentId
              ? ({ ...c, content: commentContent })
              : c
          ));

          toasterRef.current?.show({
            icon: 'tick-circle',
            intent: Intent.SUCCESS,
            message: 'Comment successfully updated.',
            timeout: 3000,
          });
        }

        const editor = editableCommentRef.current?.getEditor()!;
        editor.setEditable(false);

        setEditingCommentId(null);
      }
    );
  }

  return (
    <Layout>
      <section className={styles.buttons}>
        <button onClick={redirectBack} type='button'>Back</button>
      </section>

      <CommentsLayout
        mainContent={
          debate?.reviewItemType === ReviewItemType.MODERATOR
            ? <ModeratorDebateContent debateData={debate} />
            : (
              debate?.reviewItemType === ReviewItemType.USER
                ? <UserDebateContent debateData={debate} />
                : <p>Loading...</p>
            )
        }
      >
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

                        {
                          c.commenterId === user?.id ? (
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
                          ) : null
                        }
                      </>
                    )
                  }}
                />

                {
                  c.commentId === editingCommentId ? (
                    <div className={styles.commentButtons}>
                      <button onClick={() => cancelEditing(c)}>Cancel Edits</button>
                      <button onClick={() => saveCommentEdits(c)}>Save Edits</button>
                    </div>
                  ) : null
                }
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

      <Toaster {...toasterOptions} ref={toasterRef} />
    </Layout>
  )
}

export default Debate;