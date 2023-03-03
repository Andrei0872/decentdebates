import Layout from '@/components/Layout/Layout';
import { api } from '@/utils/api';
import { GetServerSideProps } from 'next'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styles from '@/styles/DebatePage.module.scss'
import DebateArgumentCard from '@/components/DebateArgument/DebateArgument';
import { Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { wrapper } from '@/store';
import { ArgumentType, CurrentDebate, DebateArgument, selectCrtExpandedArgument, selectCurrentDebate, setCrtExpandedArgument, setCurrentDebate } from '@/store/slices/debates.slice';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { fetchArgument } from '@/utils/api/debate';

const NEW_ARGUMENT_PAGE_REGEX = /\/debates\/\d+\/new-argument(\?counterargumentId=\d+)?/;

interface Props {
  debateInfo: CurrentDebate;
}

function DebatePage(props: Props) {
  const crtDebate = useAppSelector(selectCurrentDebate);
  const { metadata, args } = crtDebate!;

  const [crtReadArgumentId, setCrtReadArgumentId] = useState<number | null>(null);
  const [isReadArgumentLoading, setIsReadArgumentLoading] = useState(false);

  const router = useRouter();
  const dispatch = useAppDispatch();

  const crtExpandedArg = useAppSelector(selectCrtExpandedArgument);

  useEffect(() => {
    // Using this small `hack` because, if `dispatch()` is invoked when `routeChangeStart`
    // occurs, it will cause the current component to re-render again. The reason for that
    // is because this component is subscribed to the store via `useAppSelector`.
    // By invoking `teardownFn` during the `destroy` hook, we ensure that there will be no more
    // active subscriptions.
    let teardownFn: (() => void) | null = null;

    const handleRouteLeave = (url: string) => {
      if (NEW_ARGUMENT_PAGE_REGEX.test(url)) {
        return;
      }

      teardownFn = () => {
        dispatch(setCurrentDebate(null));
      };
    };

    router.events.on('routeChangeStart', handleRouteLeave);

    return () => {
      router.events.off('routeChangeStart', handleRouteLeave);
      teardownFn?.();
    }
  }, []);

  const detailedArgs = useMemo(() => {
    if (!crtExpandedArg) {
      return args;
    }

    return args.map(a => +a.argumentId === +crtExpandedArg.id ? ({ ...a, content: crtExpandedArg.content }) : a);
  }, [crtExpandedArg?.id]);

  const pros = detailedArgs.filter(a => a.argumentType === ArgumentType.PRO);
  const cons = detailedArgs.filter(a => a.argumentType === ArgumentType.CON);

  const onReadArgument = (argId: number | null) => {
    if (!argId) {
      dispatch(setCrtExpandedArgument(undefined));
      setCrtReadArgumentId(argId);
      return;
    }

    setIsReadArgumentLoading(true);

    const debateId = +router.query.id!;
    fetchArgument(debateId, argId)
      .then(arg => {
        dispatch(setCrtExpandedArgument({ id: argId, content: arg.content }));
        setCrtReadArgumentId(argId);
        setIsReadArgumentLoading(false);
      });
  }

  const redirectToNewArgumentPage = () => {
    router.push(`${router.asPath}/new-argument`);
  }

  const redirectToDebates = () => {
    router.push('/debates');
  }

  const addCounterargument = (arg: DebateArgument) => {
    router.push(`${router.asPath}/new-argument?counterargumentId=${arg.argumentId}`);
  }

  const renderAdditionalActions = (arg: DebateArgument) => (
    <Menu key="menu">
      <MenuDivider title="Actions" />
      <MenuItem onClick={() => addCounterargument(arg)} icon="add-to-artifact" text="Add counterargument" />
      {/* TODO: disable if there are no counterarguments. */}
      <MenuItem icon="eye-open" text="See the counterarguments" />
      <MenuItem icon="comparison" text="See thread" />
    </Menu>
  );

  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.buttons}>
          <div className={styles.actionButtons}>
            <button onClick={redirectToNewArgumentPage} type='button'>Add PRO/CON argument</button>
            <button type='button'>Subscribe to discussion</button>
          </div>

          <div className={styles.backButton}>
            <button onClick={redirectToDebates} type='button'>Back to debates</button>
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
                    <DebateArgumentCard
                      additionalActions={renderAdditionalActions(p)}
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
                    <DebateArgumentCard
                      additionalActions={renderAdditionalActions(p)}
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
      props: {}
    }
  }
);