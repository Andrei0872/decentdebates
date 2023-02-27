import Layout from '@/components/Layout/Layout';
import { api } from '@/utils/api';
import { GetServerSideProps } from 'next'
import React, { useCallback, useState } from 'react'
import styles from '@/styles/DebatePage.module.scss'
import DebateArgument from '@/components/DebateArgument/DebateArgument';
import { Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { wrapper } from '@/store';
import { ArgumentType, CurrentDebate, setCurrentDebate } from '@/store/slices/debates.slice';
import { useRouter } from 'next/router';

interface Props {
  debateInfo: CurrentDebate;
}

function DebatePage(props: Props) {
  const { debateInfo: { metadata, args } } = props;

  const [crtReadArgumentId, setCrtReadArgumentId] = useState<number | null>(null);

  const router = useRouter();

  const pros = args.filter(a => a.argumentType === ArgumentType.PRO);
  const cons = args.filter(a => a.argumentType === ArgumentType.CON);

  const onReadArgument = (argId: number | null) => {
    setCrtReadArgumentId(argId);
  }

  const redirectToNewArgumentPage = () => {
    router.push(`${router.asPath}/new-argument`);
  }

  const renderAdditionalActions = useCallback(() => (
    <Menu key="menu">
      <MenuDivider title="Actions" />
      <MenuItem icon="add-to-artifact" text="Add counterargument" />
      {/* TODO: disable if there are no counterarguments. */}
      <MenuItem icon="eye-open" text="See the counterarguments" />
      <MenuItem icon="comparison" text="See thread" />
    </Menu>
  ), []);

  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.buttons}>
          <div className={styles.actionButtons}>
            <button onClick={redirectToNewArgumentPage} type='button'>Add PRO/CON argument</button>
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
                  <li className={`${styles.argument} ${p.argumentId === crtReadArgumentId ? styles.isBeingRead : ''}`} key={p.argumentId}>
                    <DebateArgument
                      additionalActions={renderAdditionalActions()}
                      isExpanded={p.argumentId === crtReadArgumentId}
                      readArgument={onReadArgument}
                      debateArgumentData={p}
                    />
                  </li>
                ))
              ) : <p>No pro-arguments</p>
            }
          </ul>

          <ul className={styles.cons}>
            {
              cons.length ? (
                cons.map(p => (
                  <li className={`${styles.argument} ${p.argumentId === crtReadArgumentId ? styles.isBeingRead : ''}`} key={p.argumentId}>
                    <DebateArgument
                      additionalActions={renderAdditionalActions()}
                      isExpanded={p.argumentId === crtReadArgumentId}
                      readArgument={onReadArgument}
                      debateArgumentData={p}
                    />
                  </li>
                ))
              ) : <p>No cons-arguments</p>
            }
          </ul>
        </section>
      </div>
    </Layout>
  )
}

export default DebatePage

export const getServerSideProps = wrapper.getServerSideProps(
  store => async (context) => {
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

    store.dispatch(setCurrentDebate(debateInfo));

    return {
      props: { debateInfo }
    }
  }
);