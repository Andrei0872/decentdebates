import Layout from '@/components/Layout/Layout'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from '@/styles/NewArgument.module.scss';
import RichEditor from '@/components/RichEditor/RichEditor';
import { useForm } from 'react-hook-form';
import ExportContentPlugin, { ExportContentRefData } from '@/components/RichEditor/plugins/ExportContentPlugin';
import { Callout, Collapse, Icon, IconSize, Intent, Position, Spinner, SpinnerSize, Toaster } from '@blueprintjs/core';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { selectCurrentDebate, DebateArgument, ArgumentType, setCurrentDebate } from '@/store/slices/debates.slice';
import { useRouter } from 'next/router';
import { api } from '@/utils/api';
import { default as DebateArgumentCard } from '@/components/DebateArgument/DebateArgument';
import { createArgument, CreateArgumentData, fetchArgument, fetchDebateById, fetchDraft, saveArgumentAsDraft, submitDraft, updateDraft } from '@/utils/api/debate';
import { getCorrespondingCounterargumentType } from '@/utils/debate';
import { selectCurrentUser, setCurrentUser } from '@/store/slices/user.slice';
import { getDebateDTO } from '@/dtos/debate/get-debate.dto';
import buttonStyles from '@/styles/shared/button.module.scss';
import SimpleCollapse from '@/components/SimpleCollapse/SimpleCollapse';

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

function NewArgument() {
  const router = useRouter();
  const { counterargumentId: counterargumentIdParam, id: debateId, draftId } = router.query;

  const isCounterargumentExplicit = !!counterargumentIdParam;

  const crtDebate = useAppSelector(selectCurrentDebate);
  const crtUser = useAppSelector(selectCurrentUser);

  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<CreateArgumentFormData>({
    defaultValues: {
      argType: ArgumentType.PRO,
      ...isCounterargumentExplicit && {
        counterargumentId: +counterargumentIdParam,
        isCounterargument: true,
        argType: getCorrespondingCounterargumentType(crtDebate?.args.find(a => +a.argumentId === +counterargumentIdParam))
      },
    },
  });

  const [isCounterargumentExpanded, setIsCounterargumentExpanded] = useState(() => isCounterargumentExplicit);
  const [counterargument, setCounterargument] = useState<DebateArgument | null>(null);
  const [prefilledEditorContent, setPrefilledEditorContent] = useState<null | string>(null);
  const [isArgumentEditorReady, setIsArgumentEditorReady] = useState(true);

  const exportEditorContentRef = useRef<ExportContentRefData>(null);

  const toasterRef = useRef<Toaster>(null);

  useEffect(() => {
    if (!crtUser) {
      router.push('/');
      return () => { };
    }

    // It appears that setting the `useForm`'s default values is not enough.
    // Nor setting the value without using a timeout.
    // For now, resorting to this doesn't cause any troubles(yet!).
    if (isCounterargumentExplicit) {
      setTimeout(() => {
        setValue('counterargumentId', +counterargumentIdParam!);
      }, 0)
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) {
      return () => { };
    }

    if (!debateId || Number.isNaN(+debateId)) {
      router.push('/debates');
      return () => { };
    }

    if (isDraft) {
      setIsArgumentEditorReady(false);

      fetchDraft(+debateId, +draftId)
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
        .catch(err => {
          router.push('/debates');
        });
      return () => { };
    }

    fetchDebateById(+debateId)
      .then(d => {
        dispatch(setCurrentDebate(getDebateDTO(d)));
      })
      .catch(err => {
        router.push('/debates');
      });

  }, [router.isReady]);

  const onSubmit = (formData: CreateArgumentFormData, ev?: React.BaseSyntheticEvent) => {
    const submitter = (ev!.nativeEvent as SubmitEvent).submitter;
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
          ? updateDraft({ debateId: +debateId!, draftId: +draftId!, draftData: createdArgument })
          : saveArgumentAsDraft(crtDebate?.metadata.debateId!, createdArgument)
      )
      : (
        isUpdatingDraft
          ? submitDraft({ debateId: +debateId!, draftId: +draftId!, draftData: createdArgument })
          : createArgument(crtDebate?.metadata.debateId!, createdArgument)
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
          
          router.push(`/debates/${crtDebate?.metadata.debateId!}`);
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

        // Not using the Toaster's `onDismiss` prop because it will show
        // the below toaster twice.
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

  const isCounterargument = watch('isCounterargument') === true;
  const counterargumentId = isCounterargument ? watch('counterargumentId') : false;
  const argType = watch('argType');
  const isPageReady = !!crtDebate;

  const debateArguments = useMemo(() => {
    return crtDebate?.args.filter(arg => arg.argumentType !== argType);
  }, [argType, isPageReady]);


  useEffect(() => {
    setValue('counterargumentId', undefined);
  }, [argType]);

  useEffect(() => {
    if (!isCounterargument) {
      setValue('counterargumentId', undefined);
    }
  }, [isCounterargument]);

  useEffect(() => {
    if (!counterargumentId) {
      return;
    }

    setCounterargument(null);
    if (isCounterargumentExpanded) {
      fetchArgument(crtDebate?.metadata.debateId!, counterargumentId)
        .then(arg => setCounterargument(arg));
    }
  }, [counterargumentId]);

  const expandCounterargument = async () => {
    setIsCounterargumentExpanded(!isCounterargumentExpanded);

    if (isCounterargumentExpanded) {
      return;
    }

    if (!!counterargument) {
      return;
    }

    if (counterargumentId) {
      fetchArgument(crtDebate?.metadata.debateId!, counterargumentId)
        .then(arg => setCounterargument(arg));
    }
  }

  const unexpandedArg = useMemo(() => {
    if (!counterargumentId) {
      return null;
    }

    return crtDebate?.args.find(arg => +arg.argumentId === +counterargumentId);
  }, [counterargumentId]);

  const isUpdatingDraft = !!prefilledEditorContent;

  const isDraft = !!draftId && !Number.isNaN(+draftId);

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
            {
              isDraft ? (
                <>
                  Updating a draft
                </>
              ) : (
                <>
                  Adding a new argument
                </>
              )
            }
          </h2>
        </section>

        {
          !isPageReady ? (
            <Spinner
              className={styles.loadingSpinner}
              size={SpinnerSize.STANDARD}
            />
          ) : (
            <>
              <Callout className={styles.debateInfo}>
                <div className={styles.debateTitleContainer}>
                  <Icon size={IconSize.LARGE} icon="document" />
                  <h3>{crtDebate?.metadata.debateTitle}</h3>
                </div>
              </Callout>

              <section className={styles.argumentContainer}>
                <form className={styles.argumentForm} onSubmit={handleSubmit(onSubmit)}>
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
                    <input className={styles.counterargumentCheckInput} id='counterargumentCheck' type="checkbox" {...register('isCounterargument', { onChange: (ev) => { ev.target.checked && setCounterargument(null); } })} />
                    <div className={`${styles.counterargumentSelect} ${isCounterargument ? '' : styles.isDisabled}`}>
                      <label htmlFor='counterargumentCheck'>
                        is counterargument for
                      </label>

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
                        additionalPlugins={
                          <ExportContentPlugin ref={exportEditorContentRef} />
                        }
                        configOptions={prefilledEditorContent ? { editorState: prefilledEditorContent } : undefined}
                      />
                    ) : null
                  }

                  <div className={styles.argumentButtons}>
                    <button
                      className={`${buttonStyles.button} ${buttonStyles.success} ${buttonStyles.contained}`}
                      type='submit'
                    >
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

        <Toaster {...toasterOptions} ref={toasterRef} />
      </div>
    </Layout>
  )
}

export default NewArgument