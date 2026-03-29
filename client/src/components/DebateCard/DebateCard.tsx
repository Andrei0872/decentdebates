import styles from './DebateCard.module.scss'
import tagStyles from '@/styles/shared/debate-tag.module.scss';
import { Icon } from '@blueprintjs/core';
import { Tag } from '@/types/tag'

export interface DebateCardData {
  title: string;
  createdAt: string;
  username: string;
  tags: Tag[];
}

interface Props {
  cardData: DebateCardData
}

function DebateCard(props: Props) {
  const { cardData } = props;

  return (
    <div className={styles.container}>
      <div className={styles.title}>{cardData.title}</div>

      <div className={styles.info}>
        <div className={styles.createdBy}>
          <Icon icon="person" />
          <span>{cardData.username}</span>
        </div>
        <ul className={styles.tags}>
          {
            cardData.tags.map((t, idx) => (
              <li className={tagStyles.debateTag} key={t.id}>
                {t.name}
              </li>
            ))
          }
        </ul>
      </div>
    </div>
  )
}

export default DebateCard