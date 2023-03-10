import ActivityCard from '@/components/ActivityCard/ActivityCard';
import Layout from '@/components/Layout/Layout';
import styles from '@/styles/MyActivity.module.scss';
import { ActivityTypes, CardTypes, UserActivity } from '@/types/user';
import { fetchUserActivity } from '@/utils/api/user';
import { useEffect, useMemo, useState } from 'react';

function MyActivity() {
  const [activities, setActivities] = useState<UserActivity[]>([]);

  useEffect(() => {
    fetchUserActivity()
      .then(activities => setActivities(activities));
  }, []);

  const ongoingItems = useMemo(() => {
    return activities.filter(a => a.activityList === ActivityTypes.ONGOING);
  }, [activities]);

  const solvedItems = useMemo(() => {
    return activities.filter(a => a.activityList === ActivityTypes.SOLVED);
  }, [activities]);

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>My Activity</h1>

        <div className={styles.activities}>
          <section className={styles.ongoing}>
            <h2 className={styles.title}>Ongoing</h2>

            <ul className={styles.list}>
              {
                ongoingItems.length ? (
                  ongoingItems.map(oi => (
                    <li key={oi.cardType === CardTypes.ARGUMENT ? oi.argumentId : oi.debateId}>
                      <ActivityCard activity={oi} />
                    </li>
                  ))
                ) : <p>Nothing here yet.</p>
              }
            </ul>
          </section>

          <section className={styles.solved}>
            <h2 className={styles.title}>Solved</h2>

            <ul className={styles.list}>
              {
                solvedItems.length ? (
                  solvedItems.map(si => (
                    <li key={si.cardType === CardTypes.ARGUMENT ? si.argumentId : si.debateId}>
                      <ActivityCard activity={si} />
                    </li>
                  ))
                ) : <p>Nothing here yet.</p>
              }
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  )
}

export default MyActivity;