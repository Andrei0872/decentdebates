import Layout from '@/components/Layout/Layout';
import { api } from '@/utils/api';
import { GetServerSideProps } from 'next'
import React from 'react'
import styles from '@/styles/DebatePage.module.scss'
import DebateArgument, { ArgumentType, DebateArgumentData } from '@/components/DebateArgument/DebateArgument';

export interface DebateMetadata {
  debateId: number;
  debateTitle: string;
}

interface Props {
  debateInfo: {
    args: DebateArgumentData[];
    metadata: DebateMetadata;
  };
}

function DebatePage(props: Props) {
  const { debateInfo: { metadata, args } } = props;

  const pros = args.filter(a => a.argumentType === ArgumentType.PRO);
  const cons = args.filter(a => a.argumentType === ArgumentType.CON);

  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.buttons}>
          <div className={styles.actionButtons}>
            <button type='button'>Add PRO/CON argument</button>
            <button type='button'>Subscribe to discussion</button>
          </div>

          <div className={styles.backButton}>
            <button type='button'>Back to debates</button>
          </div>
        </section>

        <section className={styles.title}>
          <h2>{metadata.debateTitle}</h2>
        </section>

        <section className={styles.argumentsContainer}>
          <ul className={styles.pros}>
            {
              pros.length ? (
                pros.map(p => (
                  <li className={styles.argument} key={p.argumentId}>
                    <DebateArgument debateArgumentData={p} />
                  </li>
                ))
              ) : <p>No pro-arguments</p>
            }
          </ul>

          <ul className={styles.cons}>
            {
              cons.length ? (
                cons.map(p => (
                  <li className={styles.argument} key={p.argumentId}>
                    <DebateArgument debateArgumentData={p} />
                  </li>
                ))
              ) : <p>No pro-arguments</p>
            }
          </ul>
        </section>
      </div>
    </Layout>
  )
}

export default DebatePage


export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id: debateId } = context.params || {};

  if (!debateId) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      }
    }
  }

  const isIdNumber = Number.isNaN(+debateId) === false;
  if (!isIdNumber) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      }
    }
  }

  const res = await api.get(`/debates/${debateId}`, {
    withCredentials: true,
    headers: {
      cookie: context.req.headers.cookie,
    },
  });
  const debateInfo = res.data?.data;

  return {
    props: { debateInfo }
  }
}