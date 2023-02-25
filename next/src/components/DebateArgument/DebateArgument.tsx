import styles from './DebateArgument.module.scss';

export enum ArgumentType {
  PRO = 'PRO',
  CON = 'CON',
}

export interface DebateArgumentData {
  argumentId: number;
  debateId: number;
  debateTitle: string;
  ticketId: number;
  title: string;
  content: string;
  createdById: number;
  argumentType: ArgumentType;
  createdAt: string;
  username: string;
}

interface Props {
  debateArgumentData: DebateArgumentData;
}

function DebateArgument(props: Props) {
  const { debateArgumentData } = props;

  return (
    <div className={styles.argument}>
      <div className={styles.header}>
        <h3>{debateArgumentData.title}</h3>
        <div className={styles.actions}>...</div>
      </div>

      <div className={styles.body}>
        {debateArgumentData.content}
      </div>

      <div className={styles.footer}>
        <div className={styles.username}>
          {debateArgumentData.username}
        </div>

        <div className={styles.expand}>
          {/* TODO: conditional */}
          <button type='button'>Read more</button>
        </div>
      </div>
    </div>
  )
}

export default DebateArgument