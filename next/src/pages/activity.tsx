import { ReactElement, ReactNode, useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import styles from '@/styles/ModeratorActivity.module.scss';
import Layout from "@/components/Layout/Layout";
import { BoardData, BoardLists, CardData, getActivityDTO } from "@/dtos/moderator/get-activity.dto";
import { api } from "@/utils/api";

enum DNDItemTypes {
  CARD = 'CARD',
}

interface DragItem {
  fromBoardList: BoardLists;
  cardData: CardData;
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
  cardData: CardData;
  boardList: BoardLists;
}
const Card: React.FC<CardProps> = (props) => {
  const { cardData } = props;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: DNDItemTypes.CARD,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    }),
    item: () => ({
      cardData: props.cardData,
      fromBoardList: props.boardList,
    }),
  }));

  return (
    <div className={styles.card} ref={drag}>
      <div className={styles.cardHeader}>
        #{cardData.ticketLabel}
      </div>
      <div className={styles.cardBody}>
        {cardData.ticketTitle}
      </div>
      <div className={styles.cardFooter}>
        {cardData.moderatorUsername}
      </div>
    </div>
  )
}

function Activity() {
  const [activityBoards, setActivityBoards] = useState<BoardData[]>([]);
  
  useEffect(() => {
    api.get('/moderator/activity')
      .then(r => getActivityDTO(r.data.data))
      .then(r => setActivityBoards(r));
  }, []);

  const onItemDropped = (item: DragItem, toBoardList: BoardLists) => {
    const newActivityBoards = activityBoards.map(a => {
      if (a.boardList === item.fromBoardList) {
        a.cards = a.cards.filter(c => c.ticketId !== item.cardData.ticketId);
      } else if (a.boardList === toBoardList) {
        a.cards = [...a.cards, item.cardData];
      }

      return a;
    });

    setActivityBoards(newActivityBoards);
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
                    <Card boardList={b.boardList} key={c.ticketId} cardData={c} />
                  ))
                }
                itemDropped={onItemDropped}
              />
            ))
          }
        </div>
      </DndProvider>
    </Layout>
  )
}

export default Activity;