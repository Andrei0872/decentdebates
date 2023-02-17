import styles from './DebateCard.module.scss'

export interface DebateCardData {
  title: string;
  createdAt: string;
  username: string;
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
        <div className={styles.createdBy}>{cardData.username}</div>
        <div className={styles.createdAt}>{cardData.createdAt}</div>
      </div>
    </div>
  )
}

export default DebateCard