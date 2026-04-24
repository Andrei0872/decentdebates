'use client';

import Layout from '@/components/Layout/Layout';
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styles from '@/styles/DebatePage.module.scss'
import DebateArgumentCard from '@/components/DebateArgument/DebateArgument';
import { Callout, Icon, Menu, MenuDivider, MenuItem, Boundary, BreadcrumbProps, Breadcrumbs } from '@blueprintjs/core';
import { ArgumentType, CurrentDebate, DebateArgument, selectExpandedArgumentsIDs, selectCurrentDebate, setCurrentDebate, removeExpandedArgumentID, addExpandedArgumentID } from '@/store/slices/debates.slice';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { fetchArgument } from '@/utils/api/debate';
import { selectCurrentUser } from '@/store/slices/user.slice';
import buttonStyles from '@/styles/shared/button.module.scss';

interface Props {
  debateInfo: CurrentDebate;
}

export function DebatePageClient({ debateInfo }: Props) {
  const crtDebate = useAppSelector(selectCurrentDebate);
  const dispatch = useAppDispatch();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    dispatch(setCurrentDebate(debateInfo));
    return () => {
      dispatch(setCurrentDebate(null));
    };
  }, [debateInfo, dispatch]);

  const { metadata, args } = crtDebate ?? debateInfo;

  const [counterargumentsOfArgId, setCounterargumentsOfArgId] = useState<number | null>(null);
  const [counterargumentsOfArgHistory, setCounterargumentsOfArgHistory] = useState<number[]>([]);
  const [detailedArgs, setDetailedArgs] = useState(args ?? []);

  const expandedArgumentsIDsArray = useAppSelector(selectExpandedArgumentsIDs);
  const crtUser = useAppSelector(selectCurrentUser);

  const expandedArgumentsIDs = useMemo(() => {
    return new Set(expandedArgumentsIDsArray);
  }, [expandedArgumentsIDsArray]);

  const inspectedCounterargsOfArgument = useMemo(() => {
    if (!counterargumentsOfArgId) {
      return null;
    }
    return detailedArgs.find(a => +a.argumentId === +counterargumentsOfArgId);
  }, [counterargumentsOfArgId, detailedArgs]);

  const inspectCounterargumentsOf = useCallback((arg: DebateArgument) => {
    const isSameArgumentInspected = arg.argumentId === counterargumentsOfArgId;
    if (isSameArgumentInspected) {
      return;
    }
    setCounterargumentsOfArgId(arg.argumentId);
    const historyIdx = counterargumentsOfArgHistory.findIndex(id => id === arg.argumentId);
    const isPartOfHistory = historyIdx !== -1;
    if (isPartOfHistory) {
      setCounterargumentsOfArgHistory(counterargumentsOfArgHistory.slice(0, historyIdx + 1));
    } else {
      setCounterargumentsOfArgHistory([...counterargumentsOfArgHistory, arg.argumentId]);
    }
  }, [counterargumentsOfArgHistory, counterargumentsOfArgId]);

  const pros = useMemo(() => {
    if (!counterargumentsOfArgId) {
      return detailedArgs.filter(a => a.argumentType === ArgumentType.PRO);
    }
    if (inspectedCounterargsOfArgument?.argumentType === ArgumentType.PRO) {
      return [inspectedCounterargsOfArgument];
    }
    return detailedArgs.filter(a => a.argumentType === ArgumentType.PRO && a.counterargumentTo === inspectedCounterargsOfArgument?.argumentId);
  }, [counterargumentsOfArgId, detailedArgs, inspectedCounterargsOfArgument]);

  const cons = useMemo(() => {
    if (!counterargumentsOfArgId) {
      return detailedArgs.filter(a => a.argumentType === ArgumentType.CON);
    }
    if (inspectedCounterargsOfArgument?.argumentType === ArgumentType.CON) {
      return [inspectedCounterargsOfArgument];
    }
    return detailedArgs.filter(a => a.argumentType === ArgumentType.CON && a.counterargumentTo === inspectedCounterargsOfArgument?.argumentId);
  }, [counterargumentsOfArgId, detailedArgs, inspectedCounterargsOfArgument]);

  const historyBreadcrumbItems: BreadcrumbProps[] = useMemo(() => {
    return counterargumentsOfArgHistory.map(id => {
      const arg = detailedArgs.find(argument => argument.argumentId === id);
      if (!arg) {
        return {
          text: 'Unknown argument',
          icon: 'comment',
          id,
        };
      }
      return {
        text: arg.title,
        icon: "comment",
        onClick: () => {
          inspectCounterargumentsOf(arg);
        },
        id: arg.argumentId,
      };
    });
  }, [counterargumentsOfArgHistory, detailedArgs, inspectCounterargumentsOf]);

  const onCollapseArgument = (argId: number) => {
    dispatch(removeExpandedArgumentID({ id: argId }));
  }

  const onReadArgument = (argId: number) => {
    if (expandedArgumentsIDs.has(argId)) {
      return;
    }
    const debateId = Number(params.id);
    if (Number.isNaN(debateId)) {
      return;
    }
    fetchArgument(debateId, argId)
      .then(arg => {
        dispatch(addExpandedArgumentID({ id: argId }));
        setDetailedArgs(detailedArgs.map(a => a.argumentId !== argId ? a : ({ ...a, content: arg.content })));
      });
  }

  const redirectToNewArgumentPage = () => {
    router.push(`${pathname}/new-argument`);
  }

  const redirectToDebates = () => {
    router.push('/debates');
  }

  const addCounterargument = (arg: DebateArgument) => {
    router.push(`${pathname}/new-argument?counterargumentId=${arg.argumentId}`);
  }

  const disableInspectCounterargumentsMode = () => {
    setCounterargumentsOfArgId(null);
    setCounterargumentsOfArgHistory([]);
  }

  const renderAdditionalActions = (arg: DebateArgument) => {
    const shouldDisableCounterargsButton = !arg.counterarguments?.length || arg.argumentId === counterargumentsOfArgId;
    return (
      <Menu key="menu">
        <MenuDivider title="Actions" />
        {
          isAuthenticatedUser ? (
            <MenuItem onClick={() => addCounterargument(arg)} icon="add-to-artifact" text="Add counterargument" />
          ) : null
        }
        <MenuItem disabled={shouldDisableCounterargsButton} onClick={() => inspectCounterargumentsOf(arg)} icon="eye-open" text="See the counterarguments" />
      </Menu>
    )
  };

  const isAuthenticatedUser = !!crtUser;
  const isInspectingCounterargumentsOfArg = !!inspectedCounterargsOfArgument;

  if (!crtDebate && !debateInfo) {
    return null;
  }

  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.buttons}>
          {
            isAuthenticatedUser ? (
              <div className={styles.actionButtons}>
                <button
                  className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.outlined}`}
                  onClick={redirectToNewArgumentPage}
                  type='button'
                >
                  Add PRO/CON argument
                </button>

                <button
                  className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.outlined}`}
                  type='button'
                >
                  Subscribe to discussion
                </button>
              </div>
            ) : null
          }

          <div className={styles.backButton}>
            <button
              className={`${buttonStyles.button} ${buttonStyles.secondary}`}
              onClick={redirectToDebates}
              type='button'
            >
              Back to debates
            </button>
          </div>
        </section>

        <section className={styles.title}>
          <h2 data-testid="debate-title">{metadata.debateTitle}</h2>
        </section>

        {
          isInspectingCounterargumentsOfArg ? (
            <>
              <section className={styles.counterargumentsNoticeContainer}>
                <Callout className={styles.counterargumentsNotice}>
                  <div className={styles.counterargumentsHeader}>
                    <Icon icon="info-sign" />
                    <div className={styles.counterargumentsTitle}>
                      <h3>You&apos;re now in a thread of arguments and counterarguments.</h3>
                    </div>
                  </div>
                  <div className={styles.counterargumentsDisable}>
                    <i onClick={disableInspectCounterargumentsMode}><u>Click here to disable this mode.</u></i>
                  </div>
                </Callout>
              </section>

              <section className={styles.counterargumentsHistory}>
                <Breadcrumbs
                  items={historyBreadcrumbItems}
                  overflowListProps={{ alwaysRenderOverflow: false, collapseFrom: Boundary.START }}
                />
              </section>
            </>
          ) : null
        }

        <section className={styles.argumentsContainer}>
          <ul className={styles.pros}>
            {
              pros.length ? (
                pros.map(p => (
                  <li className={`${styles.argument} ${expandedArgumentsIDs.has(p.argumentId) ? styles.isBeingRead : ''}`} key={p.argumentId}>
                    <DebateArgumentCard
                      additionalActions={renderAdditionalActions(p)}
                      isExpanded={expandedArgumentsIDs.has(p.argumentId)}
                      readArgument={onReadArgument}
                      collapseArgument={onCollapseArgument}
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
                  <li className={`${styles.argument} ${expandedArgumentsIDs.has(p.argumentId) ? styles.isBeingRead : ''}`} key={p.argumentId}>
                    <DebateArgumentCard
                      additionalActions={renderAdditionalActions(p)}
                      isExpanded={expandedArgumentsIDs.has(p.argumentId)}
                      readArgument={onReadArgument}
                      collapseArgument={onCollapseArgument}
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
