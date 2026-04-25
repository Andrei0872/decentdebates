"use client";

import {
  BaseSyntheticEvent,
  Ref,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import styles from "@/styles/ModeratorActivity.module.scss";
import Layout from "@/components/Layout/Layout";
import {
  BoardData,
  BoardLists,
  ModeratorActivity,
  getActivityDTO,
  CardLabels,
  ModeratorActivityArgument,
} from "@/dtos/moderator/get-activity.dto";
import { api } from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/utils/hooks/store";
import {
  selectCurrentUser,
  setCurrentUser,
  User,
} from "@/store/slices/user.slice";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogBody,
  Icon,
  Intent,
  Menu,
  MenuItem,
  OverlayToaster,
  Popover,
  Position,
} from "@blueprintjs/core";
import {
  selectPreviewedCard,
  setActivityPreviewedCard,
  setActivityPreviewedCardArgument,
  setActivityPreviewedCardDebate,
} from "@/store/slices/moderator.slice";
import RichEditor from "@/components/RichEditor/RichEditor";
import {
  approveArgument,
  approveDebate,
  fetchArgument,
  fetchDebateByTicketId,
} from "@/utils/api/moderator";
import tagStyles from "@/styles/shared/debate-tag.module.scss";

enum DNDItemTypes {
  CARD = "CARD",
}

interface DragItem {
  fromBoardList: BoardLists;
  cardData: ModeratorActivity;
}

interface BoardProps {
  header: ReactNode;
  cards: ReactNode;
  boardType: BoardLists;

  itemDropped: (item: DragItem, toBoardList: BoardLists) => void;
}
const Board: React.FC<BoardProps> = (props) => {
  const { header, cards } = props;

  const [, drop] = useDrop(() => ({
    accept: DNDItemTypes.CARD,
    drop: (item: DragItem) => {
      props.itemDropped(item, props.boardType);
    },
  }));

  return (
    <div className={styles.board} ref={drop as unknown as Ref<HTMLDivElement>}>
      <div className={styles.boardHeader}>{header}</div>
      <div className={styles.boardBody}>{cards}</div>
    </div>
  );
};

interface CardProps {
  cardData: ModeratorActivity;
  boardList: BoardLists;
  crtUser: User;

  cardClick: (cardData: ModeratorActivity) => void;
  approveTicket: (t: ModeratorActivity) => void;
}
const Card: React.FC<CardProps> = (props) => {
  const { cardData } = props;

  const isOwnTicket = cardData.moderatorId === props.crtUser?.id;
  const isTicketAvailable = cardData.moderatorId === null;
  const hasRightsOnTicket = isOwnTicket || isTicketAvailable;

  const [, drag] = useDrag(() => ({
    type: DNDItemTypes.CARD,
    item: () => ({
      cardData: props.cardData,
      fromBoardList: props.boardList,
    }),
    canDrag: hasRightsOnTicket,
  }));

  const approveItem = (ev: BaseSyntheticEvent) => {
    ev.stopPropagation();
    props.approveTicket(cardData);
  };

  // onClick={hasRightsOnTicket ? () => props.cardClick(cardData) : undefined}
  return (
    <div
      data-testid="activity-card"
      className={`${styles.card} ${hasRightsOnTicket ? styles.canDrag : ""}`}
      ref={drag as unknown as Ref<HTMLDivElement>}
    >
      <div className={styles.cardHeader}>
        <h4 className={styles.ticketLabel}>#{cardData.ticketLabel}</h4>

        {cardData.boardList === BoardLists.IN_REVIEW && hasRightsOnTicket ? (
          <div className={styles.cardActionsContainer}>
            <Popover
              interactionKind="click"
              placement="right"
              content={
                <Menu className={styles.cardActionsList} key="menu">
                  <MenuItem
                    data-testid="approve-ticket"
                    onClick={approveItem}
                    icon="tick-circle"
                    text="Approve Ticket"
                  />
                </Menu>
              }
            >
              <span
                role="button"
                tabIndex={0}
                data-testid="card-actions-trigger"
                aria-label="Card actions"
              >
                <Icon icon="more" />
              </span>
            </Popover>
          </div>
        ) : null}
      </div>
      <div className={styles.cardBody}>
        {cardData.ticketLabel === CardLabels.DEBATE ? (
          <>
            <div className={styles.cardBodyDebateTitle}>
              <Icon icon="document" />
              <span>{cardData.ticketTitle}</span>
            </div>

            <ul className={styles.cardBodyDebateTags}>
              {cardData.tags.map((t) => (
                <li className={tagStyles.debateTag} key={t.id}>
                  {t.name}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className={styles.cardBodyArgument}>
            <div className={styles.cardBodyDebateTitle}>
              <Icon icon="document" />
              <span>{cardData.debateTitle}</span>
            </div>

            <div className={styles.cardBodyArgumentTitle}>
              <Icon icon="chat" />
              <span>{cardData.ticketTitle}</span>
            </div>
          </div>
        )}
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.cardModeratorUsername}>
          <Icon icon="person" />
          <span>
            {cardData.moderatorUsername ? (
              cardData.moderatorUsername
            ) : (
              <b>unassigned</b>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

const toasterOptions = {
  autoFocus: false,
  canEscapeKeyClear: true,
  position: Position.TOP,
  usePortal: true,
};

function Activity() {
  const [activityBoards, setActivityBoards] = useState<BoardData[]>([]);

  const previewedCard = useAppSelector(selectPreviewedCard);
  const [isArgumentLoading, setIsArgumentLoading] = useState(false);
  const [isDebateLoading, setIsDebateLoading] = useState(false);

  const crtModerator = useAppSelector(selectCurrentUser);
  const router = useRouter();

  const toasterRef = useRef<OverlayToaster>(null);

  const dispatch = useAppDispatch();

  useEffect(() => {
    api
      .get("/moderator/activity")
      .then((r) => getActivityDTO(r.data.data))
      .then((r) => setActivityBoards(r))
      .catch((err) => {
        if ([401, 403].includes(err.response.status)) {
          dispatch(setCurrentUser(null));
          router.push("/");
        }
      });
  }, [dispatch, router]);

  const onItemDropped = (item: DragItem, toBoardList: BoardLists) => {
    // TODO: remove awkward `?? null` from below by having a guard here.
    const nextModeratorId = crtModerator?.id;
    const nextModeratorUsername = crtModerator?.username;

    if (
      item.fromBoardList === BoardLists.PENDING &&
      toBoardList !== BoardLists.PENDING &&
      (!nextModeratorId || !nextModeratorUsername)
    ) {
      return;
    }

    const newActivityBoards = activityBoards.map((a) => {
      if (a.boardList === item.fromBoardList) {
        a.cards = a.cards.filter((c) => c.ticketId !== item.cardData.ticketId);
      } else if (a.boardList === toBoardList) {
        if (
          item.fromBoardList !== BoardLists.PENDING &&
          toBoardList === BoardLists.PENDING
        ) {
          item.cardData = {
            ...item.cardData,
            moderatorId: null,
            moderatorUsername: null,
          };
        } else if (
          item.fromBoardList === BoardLists.PENDING &&
          toBoardList !== BoardLists.PENDING
        ) {
          item.cardData = {
            ...item.cardData,
            moderatorId: nextModeratorId ?? null,
            moderatorUsername: nextModeratorUsername ?? null,
          };
        }

        item.cardData.boardList = toBoardList;
        a.cards = [...a.cards, item.cardData];
      }

      return a;
    });

    setActivityBoards(newActivityBoards);

    const data = {
      boardList: toBoardList,
    };
    api.patch(`/moderator/activity/ticket/${item.cardData.ticketId}`, data);
  };

  const onPreviewCardModalClose = () =>
    dispatch(setActivityPreviewedCard(null));
  const shouldShowPreviewCardModal = previewedCard !== null;

  const onCardClick = (cardData: ModeratorActivity) => {
    if (cardData.ticketLabel === CardLabels.ARGUMENT) {
      setIsArgumentLoading(true);

      fetchArgument(cardData.debateId, cardData.argumentId).then(
        (arg: ModeratorActivityArgument) => {
          setIsArgumentLoading(false);
          dispatch(setActivityPreviewedCardArgument({ ...cardData, ...arg }));
        },
      );
    } else if (cardData.ticketLabel === CardLabels.DEBATE) {
      setIsDebateLoading(true);

      fetchDebateByTicketId(cardData.ticketId).then((debate) => {
        setIsDebateLoading(false);
        dispatch(setActivityPreviewedCardDebate({ ...cardData, ...debate }));
      });
    }
  };

  const expandCardModal = () => {
    if (previewedCard?.ticketLabel === CardLabels.DEBATE) {
      router.push(`/review/debate/${previewedCard?.ticketId}`);
    } else if (previewedCard?.ticketLabel === CardLabels.ARGUMENT) {
      router.push(`/review/argument/${previewedCard?.ticketId}`);
    }
  };

  const onApproveTicket = (
    updatedBoardList: BoardLists,
    card: ModeratorActivity,
  ) => {
    const approveTicketPromise =
      card.ticketLabel === CardLabels.DEBATE
        ? approveDebate(card.ticketId.toString(), {
            debateTitle: card.ticketTitle,
            debateId: card.debateId,
          })
        : approveArgument(card.ticketId.toString(), {
            debateTitle: card.debateTitle,
            debateId: card.debateId,
            argumentId: card.argumentId,
            argumentTitle: card.ticketTitle,
          });

    approveTicketPromise.then((r) => {
      const { message } = r;
      toasterRef.current?.show({
        icon: "tick-circle",
        intent: Intent.SUCCESS,
        message: message,
        timeout: 3000,
      });

      card.boardList = BoardLists.ACCEPTED;

      setActivityBoards((boards) => {
        return boards.map((b) => {
          if (
            b.boardList !== updatedBoardList &&
            b.boardList !== BoardLists.ACCEPTED
          ) {
            return b;
          }

          if (b.boardList === BoardLists.ACCEPTED) {
            return {
              ...b,
              cards: [...b.cards, card],
            };
          }

          return {
            ...b,
            cards: b.cards.filter((c) => c.ticketId !== card.ticketId),
          };
        });
      });
    });
  };

  return (
    <Layout>
      <DndProvider backend={HTML5Backend}>
        <div className={styles.container}>
          {activityBoards.map((b) => (
            <Board
              key={b.boardList}
              boardType={b.boardList}
              header={
                <div className={styles.headerContent}>
                  <p className={styles.boardTitle}>{b.boardList}</p>
                  <p className={styles.boardItemsCount}>{b.cards.length}</p>
                </div>
              }
              cards={b.cards.map((c) => (
                <Card
                  approveTicket={(ticket) =>
                    onApproveTicket(b.boardList, ticket)
                  }
                  cardClick={onCardClick}
                  crtUser={crtModerator}
                  boardList={b.boardList}
                  key={c.ticketId}
                  cardData={c}
                />
              ))}
              itemDropped={onItemDropped}
            />
          ))}
        </div>
      </DndProvider>

      <Dialog
        className={styles.activityDialogContainer}
        isOpen={shouldShowPreviewCardModal}
        onClose={onPreviewCardModalClose}
      >
        <DialogBody
          className={styles.cardDialogBodyContainer}
          useOverflowScrollContainer={undefined}
        >
          <div className={styles.cardDialogHeader}>
            <h3 className={styles.cardTitle}>Preview</h3>
            <div className={styles.cardActions}>
              {previewedCard?.boardList !== BoardLists.PENDING ? (
                <Icon
                  onClick={expandCardModal}
                  className={styles.cardIcon}
                  icon="maximize"
                  size={14}
                />
              ) : null}
              <Icon
                onClick={onPreviewCardModalClose}
                className={styles.cardIcon}
                icon="cross"
              />
            </div>
          </div>

          <div className={styles.cardDialogBody}>
            {previewedCard?.ticketLabel === CardLabels.ARGUMENT ? (
              isArgumentLoading ? (
                <p>Loading...</p>
              ) : (
                <div className={styles.dialogArgument}>
                  <h2>{previewedCard.ticketTitle}</h2>
                  <RichEditor
                    containerClassName={styles.cardArgumentContainer}
                    configOptions={{
                      editable: false,
                      editorState: previewedCard.content,
                    }}
                  />
                </div>
              )
            ) : isDebateLoading ? (
              <p>Loading debate...</p>
            ) : (
              <div>
                <h2>{previewedCard?.title}</h2>
              </div>
            )}
            <div className={styles.addedBy}>
              Added by: <span>{previewedCard?.username}</span>
            </div>
          </div>
        </DialogBody>
      </Dialog>

      <OverlayToaster {...toasterOptions} ref={toasterRef} />
    </Layout>
  );
}

export default Activity;
