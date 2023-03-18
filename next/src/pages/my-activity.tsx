import Layout from '@/components/Layout/Layout';
import ArgumentCard from '@/components/UserActivity/ArgumentCard/ArgumentCard';
import DebateCard from '@/components/UserActivity/DebateCard/DebateCard';
import { CardLabels } from '@/dtos/moderator/get-activity.dto';
import styles from '@/styles/MyActivity.module.scss';
import { ActivityTypes, CardTypes, UserActivity, UserActivityArgument } from '@/types/user';
import { fetchUserActivity } from '@/utils/api/user';
import { Dialog, DialogBody, Icon } from '@blueprintjs/core';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

function MyActivity() {
  const [activities, setActivities] = useState<UserActivity[]>([]);

  const router = useRouter();

  const [previewedCard, setPreviewedCard] = useState<UserActivity | null>(null);

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
      return;
    }

    setPreviewedCard(arg);
  }

  const onDialogClose = () => {
    setPreviewedCard(null);
  }

  const expandDialog = () => {
    if (previewedCard?.cardType === CardTypes.ARGUMENT) {
      router.push(`/debates/${previewedCard.debateId}/new-argument?draftId=${previewedCard.argumentId}`);
    }
  }

  const shouldDisplayPreviewDialog = !!previewedCard;

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
                      {
                        oi.cardType === CardTypes.DEBATE ? (
                          <DebateCard cardData={oi} />
                        ) : (
                          <ArgumentCard click={onArgumentClick} cardData={oi} />
                        )
                      }
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
                      {
                        si.cardType === CardTypes.DEBATE ? (
                          <DebateCard cardData={si} />
                        ) : (
                          <ArgumentCard cardData={si} />
                        )
                      }
                    </li>
                  ))
                ) : <p>Nothing here yet.</p>
              }
            </ul>
          </section>
        </div>
      </div>

      <Dialog isOpen={shouldDisplayPreviewDialog} onClose={onDialogClose}>
        <DialogBody className={styles.cardDialogBodyContainer} useOverflowScrollContainer={undefined}>
          <div className={styles.cardDialogHeader}>
            <div className={styles.cardTitle}>
              <div>
                {previewedCard?.debateTitle}
              </div>
              {
                previewedCard?.cardType === CardTypes.ARGUMENT ? (
                  <div>
                    <div>{previewedCard.argumentTitle}</div>
                    {
                      previewedCard.argumentIsDraft ? (
                        <div>#draft</div>
                      ) : null
                    }
                  </div>
                ) : null
              }
            </div>
            <div className={styles.cardActions}>
              <Icon onClick={expandDialog} className={styles.cardIcon} icon="maximize" size={14} />
              <Icon onClick={onDialogClose} className={styles.cardIcon} icon="cross" />
            </div>
          </div>

          <div className={styles.cardDialogBody}>
            {/* TODO: preview arg content here */}
            {/* {
              previewedCard?.ticketLabel === CardLabels.ARGUMENT ? (
                isArgumentLoading ? <p>Loading...</p> : (
                  <ArgumentEditor containerClassName={styles.cardArgumentContainer} configOptions={{ editable: false, editorState: previewedCard.content }} />
                )
              ) : (
                <div>some debate info</div>
              )
            } */}
          </div>
        </DialogBody>
      </Dialog>
    </Layout>
  )
}

export default MyActivity;