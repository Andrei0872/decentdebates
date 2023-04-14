import { Icon, Menu, MenuDivider, MenuItem } from "@blueprintjs/core"
import { Popover2 } from "@blueprintjs/popover2"
import styles from './NotificationWidget.module.scss'

function NotificationWidget() {
  return (
    <div>
      <Popover2
        interactionKind="click"
        placement="bottom"
        usePortal={false}
        minimal={true}
        content={
          <Menu key="menu">
            <MenuDivider title="Actions" />
            <MenuItem icon="add-to-artifact" text="Add counterargument" />
            <MenuItem icon="eye-open" text="See the counterarguments" />
          </Menu>}
        renderTarget={({ isOpen, ref, ...targetProps }) => (
          <span {...targetProps} className={`${styles.bellContainer} ${targetProps.className}`} ref={ref}>
            <Icon icon="notifications" />
            <span className={styles.notificationsCount}>9+</span>
          </span>
        )}
      />

    </div>
  )
}

export default NotificationWidget