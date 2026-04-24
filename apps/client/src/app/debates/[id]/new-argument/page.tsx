'use client';

import Layout from '@/components/Layout/Layout'
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import styles from '@/styles/NewArgument.module.scss';
import RichEditor from '@/components/RichEditor/RichEditor';
import { useForm } from 'react-hook-form';
import ExportContentPlugin, { ExportContentRefData } from '@/components/RichEditor/plugins/ExportContentPlugin';
import { Callout, Icon, IconSize, Intent, OverlayToaster, Position, Spinner, SpinnerSize } from '@blueprintjs/core';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { selectCurrentDebate, DebateArgument, ArgumentType, setCurrentDebate } from '@/store/slices/debates.slice';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { default as DebateArgumentCard } from '@/components/DebateArgument/DebateArgument';
import { createArgument, CreateArgumentData, fetchArgument, fetchDebateById, fetchDraft, saveArgumentAsDraft, submitDraft, updateDraft } from '@/utils/api/debate';
import { getCorrespondingCounterargumentType } from '@/utils/debate';
import { selectCurrentUser, setCurrentUser } from '@/store/slices/user.slice';
import { getDebateDTO } from '@/dtos/debate/get-debate.dto';
import buttonStyles from '@/styles/shared/button.module.scss';
import SimpleCollapse from '@/components/SimpleCollapse/SimpleCollapse';
import { useWatch } from 'react-hook-form';

interface CreateArgumentFormData {
  counterargumentId?: number;
  argType: ArgumentType;
  isCounterargument: boolean;
  argumentTitle: string;
}

const toasterOptions = {
  autoFocus: false,
  canEscapeKeyClear: true,
  position: Position.TOP,
  usePortal: true,
};

function NewArgumentContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const debateId = params.id;
  const counterargumentIdParam = searchParams.get('counterargumentId');
  const draftId = searchParams.get('draftId');

  const isCounterargumentExplicit = !!counterargumentIdParam;
  const parsedDraftId = draftId ? Number(draftId) : null;

  const crtDebate = useAppSelector(selectCurrentDebate);
  const crtUser = useAppSelector(selectCurrentUser);

  const dispatch = useAppDispatch();
  const isDraft = !!draftId && !Number.isNaN(+draftId);
  const currentDebateId = crtDebate?.metadata.debateId;

  const {
    register,
    handleSubmit,
    setValue,
    control,
  } = useForm<CreateArgumentFormData>({
    defaultValues: {
      argType: ArgumentType.PRO,
      ...isCounterargumentExplicit && {
        counterargumentId: +counterargumentIdParam!,
        isCounterargument: true,
        argType: getCorrespondingCounterargumentType(crtDebate?.args.find(a => +a.argumentId === +counterargumentIdParam!))
      },
    },
  });

  const [isCounterargumentExpanded, setIsCounterargumentExpanded] = useState(() => isCounterargumentExplicit);
  const [counterargument, setCounterargument] = useState<DebateArgument | null>(null);
  const [prefilledEditorContent, setPrefilledEditorContent] = useState<null | string>(null);
  const [isArgumentEditorReady, setIsArgumentEditorReady] = useState(() => !isDraft);

  const exportEditorContentRef = useRef<ExportContentRefData>(null);
  const toasterRef = useRef<OverlayToaster>(null);

  useEffect(() => {
    if (!crtUser) {
      router.push('/');
      return;
    }

    if (isCounterargumentExplicit) {
      setTimeout(() => {
        setValue('counterargumentId', +counterargumentIdParam!);
      }, 0)
    }
  }, [counterargumentIdParam, crtUser, isCounterargumentExplicit, router, setValue]);

  useEffect(() => {
    if (!debateId || Number.isNaN(+debateId)) {
      router.push('/debates');
      return;
    }

    if (isDraft) {
      fetchDraft(+debateId, parsedDraftId!)
        .then(r => {
          const { debate, draft } = r;
          dispatch(setCurrentDebate(getDebateDTO(debate)));

          if (draft.counterargumentTo) {
            setTimeout(() => {
              setValue('counterargumentId', draft.counterargumentTo!);
            }, 0);
            setValue('isCounterargument', true);
          }

          setValue('argumentTitle', draft.title);
          setValue('argType', draft.argumentType);
          setPrefilledEditorContent(draft.content ?? null);
          setIsArgumentEditorReady(true);
        })
        .catch(() => {
          router.push('/debates');
        });
      return;
    }

    fetchDebateById(+debateId)
      .then(d => {
        dispatch(setCurrentDebate(getDebateDTO(d)));
      })
      .catch(() => {
        router.push('/debates');
      });
  }, [debateId, dispatch, draftId, isDraft, router, setValue, parsedDraftId]);

  const onSubmit = (formData: CreateArgumentFormData, ev?: React.BaseSyntheticEvent) => {
    const submitter = (ev?.nativeEvent as SubmitEvent | undefined)?.submitter;
    const isDraftSubmit = submitter?.dataset.isDraft === 'true';

    const editor = exportEditorContentRef.current?.getEditor();

    const createdArgument: CreateArgumentData = {
      title: formData.argumentTitle,
      content: JSON.stringify(editor?.getEditorState()),
      argumentType: formData.argType,
      ...formData.counterargumentId && { counterargumentId: +formData.counterargumentId },
    };

    const action = isDraftSubmit
      ? (
        isUpdatingDraft
          ? parsedDraftId !== null
            ? updateDraft({ debateId: +debateId, draftId: parsedDraftId, draftData: createdArgument })
            : Promise.reject(new Error('Draft ID is missing.'))
          : currentDebateId
            ? saveArgumentAsDraft(currentDebateId, createdArgument)
            : Promise.reject(new Error('Current debate is missing.'))
      )
      : (
        isUpdatingDraft
          ? parsedDraftId !== null
            ? submitDraft({ debateId: +debateId, draftId: parsedDraftId, draftData: createdArgument })
            : Promise.reject(new Error('Draft ID is missing.'))
          : currentDebateId
            ? createArgument(currentDebateId, createdArgument)
            : Promise.reject(new Error('Current debate is missing.'))
      );
    action
      .then(res => {
        toasterRef.current?.show({
          icon: 'tick-circle',
          intent: Intent.SUCCESS,
          message: res.message,
          timeout: 3000,
        });

        const isFirstTimeDraft = isDraftSubmit && !isUpdatingDraft;
        const isDraftSubmitted = !isDraftSubmit && isUpdatingDraft;
        const isDirectlySubmitted = !isDraftSubmit && !isUpdatingDraft;
        const shouldRedirect = isFirstTimeDraft || isDraftSubmitted || isDirectlySubmitted;
        if (!shouldRedirect) {
          return;
        }

        setTimeout(() => {
          if (isUpdatingDraft) {
            router.push('/my-activity');
            return;
          }
          if (currentDebateId) {
            router.push(`/debates/${currentDebateId}`);
          }
        }, 1500);
      })
      .catch((err) => {
        if (err?.response.status === 401) {
          dispatch(setCurrentUser(null));
          router.push('/');
          return;
        }

        const message = err.response.data.message;
        toasterRef.current?.show({
          icon: 'tick-circle',
          intent: Intent.DANGER,
          message,
          timeout: 2000,
        });

        setTimeout(() => {
          toasterRef.current?.show({
            icon: 'tick-circle',
            intent: Intent.NONE,
            message: 'Please try again and, if the errors persists, please contact support.',
            timeout: 5000,
          });
        }, 1000);
      })
  }

  const redirectBack = () => {
    router.back();
  }

  const isCounterargument = useWatch({ control, name: 'isCounterargument' }) === true;
  const watchedCounterargumentId = useWatch({ control, name: 'counterargumentId' });
  const counterargumentId = isCounterargument ? watchedCounterargumentId : false;
  const argType = useWatch({ control, name: 'argType' });
  const isPageReady = !!crtDebate;

  const debateArguments = useMemo(() => {
    return crtDebate?.args.filter(arg => arg.argumentType !== argType);
  }, [argType, crtDebate?.args]);

  useEffect(() => {
    setValue('counterargumentId', undefined);
  }, [argType, setValue]);

  useEffect(() => {
    if (!isCounterargument) {
      setValue('counterargumentId', undefined);
    }
  }, [isCounterargument, setValue]);

  useEffect(() => {
    if (!counterargumentId) {
      return;
    }
    if (isCounterargumentExpanded) {
      if (!currentDebateId) {
        return;
      }
      fetchArgument(currentDebateId, counterargumentId)
        .then(arg => setCounterargument(arg));
    }
  }, [counterargumentId, currentDebateId, isCounterargumentExpanded]);

  const expandCounterargument = async () => {
    setIsCounterargumentExpanded(!isCounterargumentExpanded);

    if (isCounterargumentExpanded) {
      return;
    }

    if (!!counterargument) {
      return;
    }

    if (counterargumentId) {
      if (!currentDebateId) {
        return;
      }
      fetchArgument(currentDebateId, counterargumentId)
        .then(arg => setCounterargument(arg));
    }
  }

  const unexpandedArg = useMemo(() => {
    if (!counterargumentId) {
      return null;
    }
    return crtDebate?.args.find(arg => +arg.argumentId === +counterargumentId);
  }, [counterargumentId, crtDebate]);

  const isUpdatingDraft = !!prefilledEditorContent;

  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.buttons}>
          <button
            className={`${buttonStyles.button} ${buttonStyles.secondary}`}
            onClick={redirectBack}
            type='button'
          >
            Back
          </button>
        </section>

        <section className={styles.titleContainer}>
          <h2 className={styles.title}>
            {isDraft ? <>Updating a draft</> : <>Adding a new argument</>}
          </h2>
        </section>

        {
          !isPageReady ? (
            <Spinner className={styles.loadingSpinner} size={SpinnerSize.STANDARD} />
          ) : (
            <>
              <Callout className={styles.debateInfo}>
                <div className={styles.debateTitleContainer}>
                  <Icon size={IconSize.LARGE} icon="document" />
                  <h3>{crtDebate?.metadata.debateTitle}</h3>
                </div>
              </Callout>

              <section className={styles.argumentContainer}>
                <form
                  className={styles.argumentForm}
                  onSubmit={(event) => void handleSubmit(onSubmit)(event)}
                >
                  <div className={styles.argumentType}>
                    <div className={styles.radioGroup}>
                      <label className={`${styles.argTypeLabel} ${styles.labelPRO}`} htmlFor="pro">Pro</label>
                      <input type="radio" id="pro" value="PRO" {...register('argType')} />
                    </div>
                    <div className={styles.radioGroup}>
                      <label className={`${styles.argTypeLabel} ${styles.labelCON}`} htmlFor="con">Con</label>
                      <input type="radio" id="con" value="CON" {...register('argType')} />
                    </div>
                  </div>

                  <div className={styles.counterargumentCheck}>
                    <input
                      className={styles.counterargumentCheckInput}
                      id='counterargumentCheck'
                      type="checkbox"
                      {...register('isCounterargument', {
                        onChange: (ev) => {
                          if (ev.target.checked) {
                            setCounterargument(null);
                          }
                        }
                      })}
                    />
                    <div className={`${styles.counterargumentSelect} ${isCounterargument ? '' : styles.isDisabled}`}>
                      <label htmlFor='counterargumentCheck'>is counterargument for</label>
                      <select className={styles.counterargumentSelectInput} {...register('counterargumentId')} disabled={!isCounterargument}>
                        <option value="">Select counterargument</option>
                        {
                          debateArguments?.map(arg => (
                            <option key={arg.argumentId} value={arg.argumentId}>{arg.title}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  {
                    !!counterargumentId ? (
                      <SimpleCollapse
                        expandOnClick={true}
                        header={<p className={styles.counterargumentTitle}>{unexpandedArg?.title}</p>}
                        click={expandCounterargument}
                      >
                        {
                          counterargument ? (
                            <DebateArgumentCard isExpanded={true} debateArgumentData={counterargument} />
                          ) : <p>Loading..</p>
                        }
                      </SimpleCollapse>
                    ) : null
                  }

                  <div className={styles.argumentTitle}>
                    <input {...register('argumentTitle')} type="text" placeholder='arg title' />
                  </div>

                  {
                    isArgumentEditorReady ? (
                      <RichEditor
                        containerClassName={styles.argumentEditorContainer}
                        additionalPlugins={<ExportContentPlugin ref={exportEditorContentRef} />}
                        configOptions={prefilledEditorContent ? { editorState: prefilledEditorContent } : undefined}
                      />
                    ) : null
                  }

                  <div className={styles.argumentButtons}>
                    <button className={`${buttonStyles.button} ${buttonStyles.success} ${buttonStyles.contained}`} type='submit'>
                      Submit
                    </button>
                    <button
                      className={`${buttonStyles.button} ${isUpdatingDraft ? `${buttonStyles.primary} ${buttonStyles.outlined}` : `${buttonStyles.warning} ${buttonStyles.outlined}`}`}
                      data-is-draft={true}
                      type='submit'
                    >
                      {isUpdatingDraft ? 'Update' : 'Save'} Draft
                    </button>
                  </div>
                </form>
              </section>
            </>
          )
        }

        <OverlayToaster {...toasterOptions} ref={toasterRef} />
      </div>
    </Layout>
  )
}

export default function NewArgument() {
  return (
    <Suspense>
      <NewArgumentContent />
    </Suspense>
  );
}
