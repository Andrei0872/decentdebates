import { UserActivityArgument } from "@/types/user";
import { Icon } from "@blueprintjs/core";
import styles from './ArgumentCard.module.scss'

interface Props {
  cardData: UserActivityArgument;
}

function ArgumentCard(props: Props) {
  const { cardData } = props;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>{cardData.cardType}</div>
      </div>

      <div className={styles.body}>
        {cardData.debateTitle}
      </div>

      <div className={styles.footer}>
        <div className={styles.status}>{cardData.boardList ? cardData.boardList : (cardData.argumentIsDraft ? '#draft' : null)}</div>

        {
          cardData.argumentIsDraft ? (
            null
          ) : (
            <div className={styles.moderator}>
              <div><Icon icon="person" /></div>
              <div>{cardData.moderatorUsername ?? <b>unassigned</b>}</div>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default ArgumentCard