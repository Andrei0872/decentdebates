import ActivityCard from '@/components/ActivityCard/ActivityCard';
import Layout from '@/components/Layout/Layout';
import styles from '@/styles/MyActivity.module.scss';
import { UserActivity } from '@/types/user';
import { api } from '@/utils/api';
import { useEffect, useState } from 'react';

function MyActivity() {
  const [ongoingItems, setOngoingItems] = useState<UserActivity[]>([]);
  const [solvedItems, setSolvedItems] = useState<UserActivity[]>([]);

  useEffect(() => {
    const fetchOngoingItems = () => api.get('user/ongoing-items');
    const fetchSolvedItems = () => api.get('user/solved-items');

    Promise.all([fetchOngoingItems(), fetchSolvedItems()])
      .then(resp => {
        const [{ data: { data: ongoingItems } }, { data: { data: solvedItems } }] = resp;

        setOngoingItems(ongoingItems);
        setSolvedItems(solvedItems);
      })
  }, []);

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
                    <li key={oi.ticketId}>
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
                    <li key={si.ticketId}>
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