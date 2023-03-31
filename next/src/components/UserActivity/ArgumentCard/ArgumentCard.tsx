import { UserActivityArgument } from "@/types/user";
import { Icon, IconSize } from "@blueprintjs/core";
import styles from './ArgumentCard.module.scss'

interface Props {
  cardData: UserActivityArgument;

  click?: (c: UserActivityArgument) => void;
}

function ArgumentCard(props: Props) {
  const { cardData } = props;

  return (
    <div onClick={() => props.click?.(cardData)} className={styles.container}>
      <div className={styles.header}>
        <div className={styles.argumentLabel}>{cardData.cardType}</div>
      </div>

      <div className={styles.body}>
        <p className={styles.debateTitle} >
          <Icon size={IconSize.LARGE} icon="document" />
          <span>{cardData.debateTitle}</span>
        </p>
        <p className={styles.argumentTitle}>
          <Icon size={IconSize.LARGE} icon="chat" />
          <span>{cardData.argumentTitle}</span>
        </p>
      </div>

      <div className={styles.footer}>
        <div className={`${styles.status}`}>
          {cardData.boardList ? cardData.boardList : (cardData.argumentIsDraft ? '#draft' : null)}
        </div>

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