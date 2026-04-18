import CardSlider from '@/components/CardSlider/CardSlider';
import Layout from '@/components/Layout/Layout';
import ArgumentCard from '@/components/UserActivity/ArgumentCard/ArgumentCard';
import DebateCard from '@/components/UserActivity/DebateCard/DebateCard';
import { CardLabels } from '@/dtos/moderator/get-activity.dto';
import styles from '@/styles/MyActivity.module.scss';
import { ActivityTypes, CardTypes, UserActivity, UserActivityArgument, UserActivityDebate } from '@/types/user';
import { fetchUserActivity } from '@/utils/api/user';
import { Dialog, DialogBody, Icon, IconSize } from '@blueprintjs/core';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import buttonStyles from '@/styles/shared/button.module.scss';

function MyActivity() {
  const [activities, setActivities] = useState<UserActivity[]>([]);

  const router = useRouter();

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

  const onArgumentClick = (arg: UserActivityArgument) => {
    if (!arg.argumentIsDraft) {
      router.push(`/review/argument/${arg.ticketId}`);

      return;
    }

    router.push(`/debates/${arg.debateId}/new-argument?draftId=${arg.argumentId}`);
  }

  const onDebateClick = (debateData: UserActivityDebate) => {
    router.push(`/review/debate/${debateData.ticketId}`)
  }

  return (
    <Layout>
      <div className={styles.container}>

        <section className={styles.header}>
          <h1 className={styles.pageTitle}>My Activity</h1>

          <button
            className={`${buttonStyles.button} ${buttonStyles.secondary}`}
            onClick={() => router.back()}
            type='button'
          >
            Back
          </button>
        </section>

        <div className={styles.activities}>
          <section className={styles.ongoing}>
            <h2 className={styles.title}>
              <Icon size={24} icon="build" />
              <span>Ongoing</span>
            </h2>

            {
              ongoingItems.length ? (
                <CardSlider>
                  {
                    ongoingItems.map(oi => (
                      oi.cardType === CardTypes.DEBATE ? (
                        <DebateCard click={() => onDebateClick(oi)} cardData={oi} />
                      ) : (
                        <ArgumentCard click={onArgumentClick} cardData={oi} />
                      )
                    ))
                  }
                </CardSlider>
              ) : <p>Nothing here yet.</p>
            }
          </section>

          <section className={styles.solved}>
            <h2 className={styles.title}>
              <Icon size={24} icon="tick" />
              <span>Solved</span>
            </h2>

            {
              solvedItems.length ? (
                <CardSlider>
                  {
                    solvedItems.map(si => (
                      si.cardType === CardTypes.DEBATE ? (
                        <DebateCard click={() => onDebateClick(si)} cardData={si} />
                      ) : (
                        <ArgumentCard click={onArgumentClick} cardData={si} />
                      )
                    ))
                  }
                </CardSlider>
              ) : <p>Nothing here yet.</p>
            }
          </section>
        </div>
      </div>
    </Layout>
  )
}

export default MyActivity;