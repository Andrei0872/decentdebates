import { UserActivityDebate } from "@/types/user"
import { Icon, IconSize } from "@blueprintjs/core";
import styles from './DebateCard.module.scss'
import tagStyles from '@/styles/shared/debate-tag.module.scss';

interface Props {
  cardData: UserActivityDebate;

  click?: () => void;
}

function DebateCard(props: Props) {
  const { cardData } = props;

  return (
    <div onClick={props.click} className={styles.container}>
      <div className={styles.header}>
        <div className={styles.debateLabel}>{cardData.cardType}</div>
      </div>

      <div className={styles.body}>
        <p className={styles.debateTitle}>
          <Icon size={IconSize.LARGE} icon="document" />
          <h4>{cardData.debateTitle}</h4>
        </p>

        <ul className={styles.debateTags}>
          {
            cardData.tags.map((t, idx) => (
              <li className={tagStyles.debateTag} key={idx}>
                {t}
              </li>
            ))
          }
        </ul>
      </div>

      <div className={styles.footer}>
        <div className={styles.status}>{cardData.boardList}</div>

        <div className={`${styles.moderator} ${!cardData.moderatorUsername ? styles.unassigned : ''}`}>
          <div><Icon icon="person" /></div>
          <div>{cardData.moderatorUsername ?? <b>unassigned</b>}</div>
        </div>
      </div>
    </div>
  )
}

export default DebateCard