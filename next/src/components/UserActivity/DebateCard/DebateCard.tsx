import { UserActivityDebate } from "@/types/user"
import { Icon } from "@blueprintjs/core";
import styles from './DebateCard.module.scss'

interface Props {
  cardData: UserActivityDebate;

  click?: () => void;
}

function DebateCard(props: Props) {
  const { cardData } = props;

  return (
    <div onClick={props.click} className={styles.container}>
      <div className={styles.header}>
        <div>{cardData.cardType}</div>
      </div>

      <div className={styles.body}>
        {cardData.debateTitle}
      </div>

      <div className={styles.footer}>
        <div className={styles.status}>{cardData.boardList}</div>
        
        <div className={styles.moderator}>
          <div><Icon icon="person" /></div>
          <div>{cardData.moderatorUsername ?? <b>unassigned</b>}</div>
        </div>
      </div>
    </div>
  )
}

export default DebateCard