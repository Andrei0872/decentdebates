import CommentsLayout from '@/components/Comments/CommentsLayout';
import Layout from '@/components/Layout/Layout';
import { selectCurrentUser, setCurrentUser, UserRoles } from '@/store/slices/user.slice';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { useRouter } from 'next/router'
import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react';
import { Comment as IComment, UpdateCommentData } from '@/types/comment';
import styles from '@/styles/ReviewArgument.module.scss';
import Comment, { CommentRef } from '@/components/Comments/Comment';
import { Callout, Icon, Intent, Menu, MenuItem, Position, Toaster } from '@blueprintjs/core';
import { fetchArgumentAsModerator, fetchArgumentAsUser } from '@/utils/api/review';
import { ArgumentAsModerator, ArgumentAsUser, ReviewItemType } from '@/types/review';
import RichEditor from '@/components/RichEditor/RichEditor';
import { DebateArgument } from '@/store/slices/debates.slice';
import { fetchArgument } from '@/utils/api/debate';
import { Popover2 } from '@blueprintjs/popover2';
import { io, Socket } from 'socket.io-client';
import { fetchTicketComments } from '@/utils/api/comment';
import ExportContentPlugin, { ExportContentRefData } from '@/components/RichEditor/plugins/ExportContentPlugin';

interface ModeratorArgumentContentProps {
  argumentData: ArgumentAsModerator;

  counterargumentClick: () => void;
}
function ModeratorArgumentContent(props: ModeratorArgumentContentProps) {
  const { argumentData } = props;

  return (
    <div className={styles.moderatorArgumentContainer}>
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

      <div className={styles.argUserInformation}>
        <div className={styles.addedBy}>
          Added by <span>{argumentData.username}</span>
        </div>
      </div>
    </div>
  );
}

interface UserArgumentContentProps {
  argumentData: ArgumentAsUser;

  counterargumentClick: () => void;
}
type ArgumentModifiedFields = Partial<Pick<ArgumentAsUser, 'argumentTitle'>>;
const ArgumentPlaceholder = () => <div>Argument Placeholder...</div>;
function UserArgumentContent(props: UserArgumentContentProps) {
  const { argumentData } = props;

  const [isEditMode, setIsEditMode] = useState(false);
  const [argumentModifiedFields, setArgumentModifiedFields] = useState<ArgumentModifiedFields>({ argumentTitle: argumentData.argumentTitle });

  const argumentRef = useRef<ExportContentRefData | null>(null);

  const toggleEditOrSave = () => {
    const editor = argumentRef.current?.getEditor();

    if (!isEditMode) {
      setIsEditMode(true);

      editor?.setEditable(true);

      setArgumentModifiedFields({
        argumentTitle: argumentData.argumentTitle,
      });

      return;
    }

    setIsEditMode(false);
    editor?.setEditable(false);

    const content = JSON.stringify(editor?.getEditorState() ?? null);
    if (!content) {
      return;
    }

    if (!argumentModifiedFields.argumentTitle) {
      return;
    }

    console.log(argumentModifiedFields.argumentTitle, content);
  }

  const onTitleChanged = (ev: BaseSyntheticEvent<InputEvent, any, HTMLInputElement>) => {
    const { value } = ev.target;
    if (!value.trim()) {
      return;
    }

    setArgumentModifiedFields({
      ...argumentModifiedFields,
      argumentTitle: value,
    });
  }

  const cancelChanges = () => {
    resetEditMode();

    const editor = argumentRef.current?.getEditor();
    editor?.setEditorState(editor.parseEditorState(argumentData.argumentContent));
  }

  const resetEditMode = () => {
    setIsEditMode(false);

    const editor = argumentRef.current?.getEditor();
    editor?.setEditable(false);

    setArgumentModifiedFields({ argumentTitle: undefined });
  }


  return (
    <div className={styles.moderatorArgumentContainer}>
      <Callout className={styles.debateInfo}>
        <div className={styles.debateTitleContainer}>
          <i className={styles.debateIcon}></i>
          <h3>{argumentData.debateTitle}</h3>
        </div>
      </Callout>

      <div className={styles.userArgEditButtons}>
        <button onClick={toggleEditOrSave} type='button'>
          {
            !isEditMode ? ('Edit Argument') : ('Save Changes')
          }
        </button>

        {
          isEditMode ? (
            <button onClick={cancelChanges} type='button'>Cancel Changes</button>
          ) : null
        }
      </div>

      <div className={styles.argContainer}>
        <h2 className={styles.argTitle}>
          {
            isEditMode ? (
              <input type="text" value={argumentModifiedFields.argumentTitle} onChange={onTitleChanged} />
            ) : <>{argumentData.argumentTitle}</>
          }
        </h2>

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
            configOptions={{ editable: isEditMode, editorState: argumentData.argumentContent }}
            additionalPlugins={<ExportContentPlugin ref={argumentRef} />}
            placeholder={<ArgumentPlaceholder />}
          />
        </div>
      </div>

      {
        argumentData.moderatorId ? (
          <div className={styles.argModeratorInformation}>
            <div className={styles.reviewedBy}>
              Reviewed by <span>{argumentData.moderatorUsername}</span>
            </div>
          </div>
        ) : <div className={styles.argNoModerator}>No moderator assigned.</div>
      }
    </div>
  );
}

const RIGHT_PANEL_WIDTH = 300;

const toasterOptions = {
  autoFocus: false,
  canEscapeKeyClear: true,
  position: Position.TOP,
  usePortal: true,
};

let socket: Socket | undefined;
function Argument() {
  const router = useRouter()
  const { id: ticketId } = router.query

  const dispatch = useAppDispatch();

  const user = useAppSelector(selectCurrentUser);

  const [shouldDisplayRightPanel, setShouldDisplayRightPanel] = useState(false)
  const [argument, setArgument] = useState<ArgumentAsModerator | ArgumentAsUser | null>(null);
  const [counterargument, setCounterargument] = useState<DebateArgument | null>(null);
  const [comments, setComments] = useState<IComment[]>([]);
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
      return;
    }

    if (!user) {
      router.push('/');
    }

    (user!.role === UserRoles.MODERATOR ? fetchArgumentAsModerator : fetchArgumentAsUser)((ticketId as string))
      .then(arg => setArgument(arg))
      .catch(() => {
        router.push('/');
        dispatch(setCurrentUser(null));
      });
  }, [router.isReady]);

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

    socket.on('comment/argument:create', (data: any) => {
      const { insertedComment } = data;
      if (!insertedComment) {
        return;
      }

      editableCommentRef.current?.clearContent();
      setComments(comments => [...comments, insertedComment]);
    })

    socket.on('comment/argument:update', (data: { updatedComment: UpdateCommentData }) => {
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
    const comment = editableCommentRef.current?.getContent();
    if (!comment) {
      // TODO: some validation + informational message.
      return;
    }

    socket?.emit('comment/argument:create', { comment });
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
      'comment/argument:update',
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
                : (
                  argument?.reviewItemType === ReviewItemType.USER
                    ? <UserArgumentContent counterargumentClick={onCounterargumentClick} argumentData={argument} />
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

      <Toaster {...toasterOptions} ref={toasterRef} />
    </Layout>
  )
}

export default Argument;