import { Notification } from "@/types/notification";
import { fetchNotifications } from "@/utils/api/notification";
import { Icon, Menu, MenuDivider, MenuItem, Spinner, SpinnerSize } from "@blueprintjs/core"
import { Popover2 } from "@blueprintjs/popover2"
import { useEffect, useState } from "react";
import RichEditor from "../RichEditor/RichEditor";
import styles from './NotificationWidget.module.scss'

function NotificationWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number | null>(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  useEffect(() => {
    const notifSource = new EventSource(`${process.env.NEXT_PUBLIC_API_SERVER_URL}/notification/count`, { withCredentials: true });

    const onMessage = (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      const nextCount = (unreadNotificationsCount ?? 0) + data.unreadCount;

      // Setting it to null so that we can fetch it the first time
      // when there are no unread notifications.
      setUnreadNotificationsCount(!nextCount ? null : nextCount);
    };
    notifSource.addEventListener('message', onMessage);

    return () => {
      notifSource!.close();
      notifSource!.removeEventListener('message', onMessage);
    }
  }, []);

  const handleInteraction = (nextState: boolean) => {
    // `Popover2`'s `componentDidUpdate` will cause this function to be called again.
    // We resort to this check in order to prevent fetching notifications more than once.
    if (nextState === isOpen) {
      return;
    }

    setIsOpen(nextState);

    if (!nextState) {
      setTimeout(() => {
        setNotifications(notifications.map(n => ({ ...n, isMerelyRead: false })));
      }, 100);
      return;
    }

    const shouldFetchNotifications = unreadNotificationsCount === null || unreadNotificationsCount > 0;
    if (!shouldFetchNotifications) {
      return;
    }

    setIsLoadingNotifications(true);
    fetchNotifications()
      .then(r => {
        setUnreadNotificationsCount(0);
        setNotifications(r.notifications);
        setIsLoadingNotifications(false);
      });
  }

  return (
    <div>
      <Popover2
        interactionKind="click"
        placement="bottom"
        usePortal={true}
        minimal={true}
        modifiers={{
          offset: {
            fn(arg) {
              // Might be an interesting adventure to explore why this works.
              // Without this, the notifications list will be displayed outside the window,
              // causing _x_ overflow.
              arg.options.offset = [null, null]
            },
          }
        }}
        content={
          isLoadingNotifications ? (
            <Spinner
              className={styles.loadingSpinner}
              size={SpinnerSize.STANDARD}
            />
          ) : (
            notifications.length ? (
              <ul className={styles.notificationsList} key="menu">
                {
                  notifications.map(n => (
                    <li
                      className={`${styles.notificationItem} ${n.isMerelyRead ? styles.isMerelyRead : ''}`}
                      key={n.id}
                    >
                      <div className={styles.notificationHeader}>
                        <h4 className={styles.notificationTitle}>{n.title}</h4>
                      </div>
                      <RichEditor containerClassName={styles.argumentEditorContainer} configOptions={{ editable: false, editorState: n.content }} />
                    </li>
                  ))
                }
              </ul>
            ) : <p className={styles.noNotifications}>No notifications.</p>
          )
        }
        renderTarget={({ isOpen, ref, ...targetProps }) => (
          <span {...targetProps} className={`${styles.bellContainer} ${targetProps.className}`} ref={ref}>
            <Icon icon="notifications" />
            {
              unreadNotificationsCount ? (
                <span className={styles.notificationsCount}>{unreadNotificationsCount}</span>
              ) : null
            }
          </span>
        )}
        isOpen={isOpen}
        onInteraction={handleInteraction}
      />
    </div>
  )
}

export default NotificationWidget