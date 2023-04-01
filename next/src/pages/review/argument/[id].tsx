import CommentsLayout from '@/components/Comments/CommentsLayout';
import Layout from '@/components/Layout/Layout';
import { selectCurrentUser, setCurrentUser, UserRoles } from '@/store/slices/user.slice';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { useRouter } from 'next/router'
import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react';
import { Comment as IComment, UpdateCommentData } from '@/types/comment';
import styles from '@/styles/ReviewArgument.module.scss';
import Comment, { CommentRef } from '@/components/Comments/Comment';
import { Callout, Icon, IconSize, Intent, Menu, MenuItem, Position, Toaster } from '@blueprintjs/core';
import { fetchArgumentAsModerator, fetchArgumentAsUser } from '@/utils/api/review';
import { ArgumentAsModerator, ArgumentAsUser, ReviewItemType, UpdateArgumentData } from '@/types/review';
import RichEditor from '@/components/RichEditor/RichEditor';
import { DebateArgument } from '@/store/slices/debates.slice';
import { fetchArgument } from '@/utils/api/debate';
import { Popover2 } from '@blueprintjs/popover2';
import { io, Socket } from 'socket.io-client';
import { fetchTicketComments } from '@/utils/api/comment';
import ExportContentPlugin, { ExportContentRefData } from '@/components/RichEditor/plugins/ExportContentPlugin';
import buttonStyles from '@/styles/shared/button.module.scss';

interface ModeratorArgumentContentProps {
  argumentData: ArgumentAsModerator;

  counterargumentClick: () => void;
}
function ModeratorArgumentContent(props: ModeratorArgumentContentProps) {
  const { argumentData } = props;

  const argumentRef = useRef<ExportContentRefData | null>(null);

  useEffect(() => {
    if (!argumentData?.argumentContent) {
      return;
    }

    const editor = argumentRef.current?.getEditor();
    editor?.setEditorState(editor.parseEditorState(argumentData.argumentContent));

  }, [argumentData?.argumentContent]);

  return (
    <div className={styles.moderatorArgumentContainer}>
      <Callout className={styles.debateInfo}>
        <div className={styles.debateTitleContainer}>
          <Icon size={IconSize.LARGE} icon="document" />
          <h3>{argumentData.debateTitle}</h3>
        </div>
      </Callout>

      <div className={styles.argContainer}>
        <h2 className={styles.argTitle}>{argumentData.argumentTitle}</h2>

        <div className={styles.argInfo}>
          <div className={`${styles.argType} ${styles[argumentData.argumentType]}`}>{argumentData.argumentType}</div>

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
            additionalPlugins={<ExportContentPlugin ref={argumentRef} />}
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
  updateArgument: (data: UpdateArgumentData) => void;
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

    const content = JSON.stringify(editor?.getEditorState() ?? null);
    if (!content) {
      return;
    }

    if (!argumentModifiedFields.argumentTitle) {
      return;
    }

    props.updateArgument({
      title: argumentModifiedFields.argumentTitle,
      content,
    });

    resetEditMode();
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

      <div className={styles.userArgEditButtons}>
        <button
          className={`${buttonStyles.button} ${isEditMode ? buttonStyles.success : buttonStyles.warning} ${buttonStyles.contained}`}
          onClick={toggleEditOrSave}
          type='button'
        >
          {
            !isEditMode ? ('Edit Argument') : ('Save Changes')
          }
        </button>

        {
          isEditMode ? (

            <button
              className={`${buttonStyles.button} ${buttonStyles.danger} ${buttonStyles.contained}`}
              onClick={cancelChanges}
              type='button'
            >
              Cancel Changes
            </button>
          ) : null
        }
      </div>
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

    socket = io(`${process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL!}/review`, { autoConnect: false, withCredentials: true, query: { ticketId } });

    socket.on('connect', () => {
      console.log('connect');
    });

    socket.on('error', err => {
      router.push('/');
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

    // Only the user can update its own argument.
    // Here is the moderator receiving the update.
    socket.on('argument:update', (updatedArg: UpdateArgumentData) => {
      toasterRef.current?.show({
        icon: 'tick-circle',
        intent: Intent.WARNING,
        message: 'The argument has been updated!',
        timeout: 3000,
      });

      setArgument(argument => {
        if (argument?.reviewItemType !== ReviewItemType.MODERATOR) {
          return argument;
        }

        return {
          ...argument,
          argumentContent: updatedArg.content,
          argumentTitle: updatedArg.title
        }
      });
    });

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

  // Only a user can update their own argument.
  const onUpdateArgument = (data: UpdateArgumentData) => {
    if (argument?.reviewItemType !== ReviewItemType.USER) {
      return;
    }

    socket?.emit(
      'argument:update',
      // { data: { ...data, argumentId: argument.argumentId } },
      {},
      (responseMessage: string) => {
        if (responseMessage === 'OK') {
          setArgument({
            ...argument,
            argumentTitle: data.title,
            argumentContent: data.content,
          });

          toasterRef.current?.show({
            icon: 'tick-circle',
            intent: Intent.SUCCESS,
            message: 'Argument successfully updated.',
            timeout: 3000,
          });
        }
      }
    );
  }

  return (
    <Layout>
      <div className={styles.panelsContainer}>
        <div style={{ width: shouldDisplayRightPanel ? `${window.innerWidth - RIGHT_PANEL_WIDTH}px` : '100%' }} className={styles.leftPanel}>
          <section className={styles.buttons}>
            <button
              className={`${buttonStyles.button} ${buttonStyles.secondary}`}
              onClick={redirectBack}
              type='button'
            >
              Back
            </button>
          </section>

          <CommentsLayout
            mainContent={
              argument?.reviewItemType === ReviewItemType.MODERATOR
                ? <ModeratorArgumentContent counterargumentClick={onCounterargumentClick} argumentData={argument} />
                : (
                  argument?.reviewItemType === ReviewItemType.USER
                    ? <UserArgumentContent updateArgument={onUpdateArgument} counterargumentClick={onCounterargumentClick} argumentData={argument} />
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
                            <div className={`${styles.commenter} ${user?.id === c.commenterId ? styles.isOwnComment : ''}`}>{c.commenterUsername}</div>
                            <div className={styles.commentCreatedAt}>{c.createdAt}</div>
                            <div className={styles.commentIsEdited}>Edited</div>

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
                          <button
                            className={`${buttonStyles.button} ${buttonStyles.danger} ${buttonStyles.contained}`}
                            onClick={() => cancelEditing(c)}
                          >
                            Cancel Edits
                          </button>

                          <button
                            className={`${buttonStyles.button} ${buttonStyles.success} ${buttonStyles.contained}`}
                            onClick={() => saveCommentEdits(c)}
                          >
                            Save Edits
                          </button>
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
              <button
                className={`${buttonStyles.button} ${buttonStyles.success} ${buttonStyles.contained}`}
                disabled={!!editingCommentId}
                type='button'
                onClick={addComment}
              >
                Add Comment
              </button>
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