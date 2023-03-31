import CardSlider from '@/components/CardSlider/CardSlider';
import Layout from '@/components/Layout/Layout';
import ArgumentCard from '@/components/UserActivity/ArgumentCard/ArgumentCard';
import DebateCard from '@/components/UserActivity/DebateCard/DebateCard';
import { CardLabels } from '@/dtos/moderator/get-activity.dto';
import styles from '@/styles/MyActivity.module.scss';
import { ActivityTypes, CardTypes, UserActivity, UserActivityArgument, UserActivityDebate } from '@/types/user';
import { fetchUserActivity } from '@/utils/api/user';
import { Dialog, DialogBody, Icon } from '@blueprintjs/core';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import buttonStyles from '@/styles/shared/button.module.scss';

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
      router.push(`/review/argument/${arg.ticketId}`);

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

  const onDebateClick = (debateData: UserActivityDebate) => {
    router.push(`/review/debate/${debateData.ticketId}`)
  }

  const shouldDisplayPreviewDialog = !!previewedCard;

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
            <h2 className={styles.title}>Ongoing</h2>

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
            <h2 className={styles.title}>Solved</h2>

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