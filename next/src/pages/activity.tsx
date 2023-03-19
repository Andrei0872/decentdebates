import { ReactElement, ReactNode, useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import styles from '@/styles/ModeratorActivity.module.scss';
import Layout from "@/components/Layout/Layout";
import { BoardData, BoardLists, ModeratorActivity, getActivityDTO, CardLabels, ModeratorActivityArgument } from "@/dtos/moderator/get-activity.dto";
import { api } from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/utils/hooks/store";
import { selectCurrentUser, setCurrentUser, User } from "@/store/slices/user.slice";
import { useRouter } from "next/router";
import { Dialog, DialogBody, Icon, IconSize } from "@blueprintjs/core";
import { selectPreviewedCard, setActivityPreviewedCard, setActivityPreviewedCardArgument } from "@/store/slices/moderator.slice";
import ArgumentEditor from "@/components/ArgumentEditor/ArgumentEditor";
import { fetchArgument } from "@/utils/api/moderator";

enum DNDItemTypes {
  CARD = 'CARD',
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

  // TODO: should `board_list` be provided as deps ?
  const [{ isOver }, drop] = useDrop(() => ({
    accept: DNDItemTypes.CARD,
    drop: (item: DragItem, monitor) => {
      props.itemDropped(item, props.boardType);
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div className={styles.board} ref={drop}>
      <div className={styles.boardHeader}>
        {header}
      </div>
      <div className={styles.boardBody}>
        {cards}
      </div>
    </div>
  );
}

interface CardProps {
  cardData: ModeratorActivity;
  boardList: BoardLists;
  crtUser: User;

  cardClick: (cardData: ModeratorActivity) => void;
}
const Card: React.FC<CardProps> = (props) => {
  const { cardData } = props;

  const isOwnTicket = cardData.moderatorId === props.crtUser?.id;
  const isTicketAvailable = cardData.moderatorId === null;
  const hasRightsOnTicket = isOwnTicket || isTicketAvailable;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: DNDItemTypes.CARD,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    }),
    item: () => ({
      cardData: props.cardData,
      fromBoardList: props.boardList,
    }),
    canDrag: hasRightsOnTicket,
  }));

  return (
    <div onClick={hasRightsOnTicket ? () => props.cardClick(cardData) : undefined} className={`${styles.card} ${hasRightsOnTicket ? styles.canDrag : ''}`} ref={drag}>
      <div className={styles.cardHeader}>
        #{cardData.ticketLabel}
      </div>
      <div className={styles.cardBody}>
        {
          cardData.ticketLabel === CardLabels.DEBATE ? (
            <div>{cardData.ticketTitle}</div>
          ) : (
            <>
              <div>{cardData.debateTitle}</div>
              <div>{cardData.ticketTitle}</div>
            </>
          )
        }
      </div>
      <div className={styles.cardFooter}>
        {cardData.moderatorUsername ? cardData.moderatorUsername : <b>unassigned</b>}
      </div>
    </div>
  )
}

function Activity() {
  const [activityBoards, setActivityBoards] = useState<BoardData[]>([]);

  const previewedCard = useAppSelector(selectPreviewedCard);
  const [isArgumentLoading, setIsArgumentLoading] = useState(false);

  const crtModerator = useAppSelector(selectCurrentUser);
  const router = useRouter();

  const dispatch = useAppDispatch();

  useEffect(() => {
    api.get('/moderator/activity')
      .then(r => getActivityDTO(r.data.data))
      .then(r => setActivityBoards(r))
      .catch(err => {
        if ([401, 403].includes(err.response.status)) {
          dispatch(setCurrentUser(null));
          router.push('/');
        }
      })
  }, []);

  const onItemDropped = (item: DragItem, toBoardList: BoardLists) => {
    const newActivityBoards = activityBoards.map(a => {
      if (a.boardList === item.fromBoardList) {
        a.cards = a.cards.filter(c => c.ticketId !== item.cardData.ticketId);
      } else if (a.boardList === toBoardList) {
        if (item.fromBoardList !== BoardLists.PENDING && toBoardList === BoardLists.PENDING) {
          item.cardData = {
            ...item.cardData,
            moderatorId: null,
            moderatorUsername: null,
          }
        } else if (item.fromBoardList === BoardLists.PENDING && toBoardList !== BoardLists.PENDING) {
          item.cardData = {
            ...item.cardData,
            moderatorId: crtModerator?.id!,
            moderatorUsername: crtModerator?.username!,
          }
        }

        a.cards = [...a.cards, item.cardData];
      }

      return a;
    });

    setActivityBoards(newActivityBoards);

    const data = {
      boardList: toBoardList,
    }
    api.patch(`/moderator/activity/ticket/${item.cardData.ticketId}`, data)
  }

  const onPreviewCardModalClose = () => dispatch(setActivityPreviewedCard(null));
  const shouldShowPreviewCardModal = previewedCard !== null;

  const onCardClick = (cardData: ModeratorActivity) => {
    if (cardData.ticketLabel === CardLabels.ARGUMENT) {
      setIsArgumentLoading(true);

      fetchArgument(cardData.debateId, cardData.argumentId)
        .then((arg: ModeratorActivityArgument) => {
          setIsArgumentLoading(false);
          dispatch(setActivityPreviewedCardArgument({ ...cardData, ...arg }));
        });
    }

    dispatch(setActivityPreviewedCard(cardData));
  }

  const expandCardModal = () => {
    if (previewedCard?.ticketLabel === CardLabels.DEBATE) {
      router.push(`/review/debate/${previewedCard?.ticketId}`);
    } else if (previewedCard?.ticketLabel === CardLabels.ARGUMENT) {
      router.push(`/review/argument/${previewedCard?.ticketId}`);
    }
  }

  return (
    <Layout>
      <DndProvider backend={HTML5Backend}>
        <div className={styles.container}>
          {
            activityBoards.map(b => (
              <Board
                key={b.boardList}
                boardType={b.boardList}
                header={<p>{b.boardList}</p>}
                cards={
                  b.cards.map(c => (
                    <Card cardClick={onCardClick} crtUser={crtModerator} boardList={b.boardList} key={c.ticketId} cardData={c} />
                  ))
                }
                itemDropped={onItemDropped}
              />
            ))
          }
        </div>
      </DndProvider>

      <Dialog isOpen={shouldShowPreviewCardModal} onClose={onPreviewCardModalClose}>
        <DialogBody className={styles.cardDialogBodyContainer} useOverflowScrollContainer={undefined}>
          <div className={styles.cardDialogHeader}>
            <div className={styles.cardTitle}>
              {previewedCard?.ticketTitle}
            </div>
            <div className={styles.cardActions}>
              <Icon onClick={expandCardModal} className={styles.cardIcon} icon="maximize" size={14} />
              <Icon onClick={onPreviewCardModalClose} className={styles.cardIcon} icon="cross" />
            </div>
          </div>

          <div className={styles.cardDialogBody}>
            {
              previewedCard?.ticketLabel === CardLabels.ARGUMENT ? (
                isArgumentLoading ? <p>Loading...</p> : (
                  <ArgumentEditor containerClassName={styles.cardArgumentContainer} configOptions={{ editable: false, editorState: previewedCard.content }} />
                )
              ) : (
                <div>some debate info</div>
              )
            }
          </div>
        </DialogBody>
      </Dialog>
    </Layout>
  )
}

export default Activity;