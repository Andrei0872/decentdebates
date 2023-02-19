import { UserActivity } from '@/types/user';
import styles from './ActivityCard.module.scss';

interface Props {
  activity: UserActivity;
}

function ActivityCard(props: Props) {
  const { activity } = props;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        X
        {activity.itemType}
      </div>

      <div className={styles.body}>
        {activity.title}
      </div>

      <div className={styles.footer}>
        <span>{activity.boardList}</span>
        {
          activity.moderatorUsername ? (
            <span>{activity.moderatorUsername}</span>
          ) : null
        }
      </div>
    </div>
  )
}

export default ActivityCard