import Layout from '@/components/Layout/Layout'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from '@/styles/NewArgument.module.scss';
import ArgumentEditor from '@/components/ArgumentEditor/ArgumentEditor';
import { useForm } from 'react-hook-form';
import ExportContentPlugin, { ExportContentRefData } from '@/components/ArgumentEditor/plugins/ExportContentPlugin';
import { Callout, Collapse, Icon, Intent, Position, Spinner, SpinnerSize, Toaster } from '@blueprintjs/core';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { selectCurrentDebate, DebateArgument, ArgumentType, setCurrentDebate } from '@/store/slices/debates.slice';
import { useRouter } from 'next/router';
import { api } from '@/utils/api';
import { default as DebateArgumentCard } from '@/components/DebateArgument/DebateArgument';
import { createArgument, CreateArgumentData, fetchArgument, fetchDebateById, fetchDraft, saveArgumentAsDraft, submitDraft, updateDraft } from '@/utils/api/debate';
import { getCorrespondingCounterargumentType } from '@/utils/debate';
import { selectCurrentUser } from '@/store/slices/user.slice';
import { getDebateDTO } from '@/dtos/debate/get-debate.dto';

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
    if (!router.isReady || !!crtDebate) {
      return () => { };
    }

    if (!debateId || Number.isNaN(+debateId)) {
      router.push('/debates');
      return () => { };
    }

    const isDraft = !!draftId && !Number.isNaN(+draftId);
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
          router.push(`/debates/${crtDebate?.metadata.debateId!}`);
        }, 1500);
      })
      .catch((err) => {
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

  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.buttons}>
          <button onClick={redirectBack} type='button'>Back</button>
        </section>

        <section className={styles.titleContainer}>
          <h2 className={styles.title}>Adding a new argument</h2>
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
                  <i className={styles.debateIcon}></i>
                  <h3>{crtDebate?.metadata.debateTitle}</h3>
                </div>
              </Callout>

              <section className={styles.argumentContainer}>
                <form className={styles.argumentForm} onSubmit={handleSubmit(onSubmit)}>
                  <div className={styles.argumentType}>
                    <div className={styles.radioGroup}>
                      <label htmlFor="pro">Pro</label>
                      <input type="radio" id="pro" value="PRO" {...register('argType')} />
                    </div>

                    <div className={styles.radioGroup}>
                      <label htmlFor="con">Con</label>
                      <input type="radio" id="con" value="CON" {...register('argType')} />
                    </div>
                  </div>

                  <div className={styles.counterargumentCheck}>
                    <input id='counterargumentCheck' type="checkbox" {...register('isCounterargument', { onChange: (ev) => { ev.target.checked && setCounterargument(null); } })} />
                    <div className={`${styles.counterargumentSelect} ${isCounterargument ? '' : styles.isDisabled}`}>
                      <label htmlFor='counterargumentCheck'>
                        is counterargument for
                      </label>

                      <select {...register('counterargumentId')} disabled={!isCounterargument}>
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
                      <div>
                        <button onClick={expandCounterargument} type='button'>{unexpandedArg!.title} <Icon icon="chevron-down" /></button>
                        <Collapse isOpen={isCounterargumentExpanded}>
                          <div className={styles.counterArgContainer}>
                            {
                              counterargument ? (
                                <DebateArgumentCard isExpanded={true} debateArgumentData={counterargument} />
                              ) : <p>Loading..</p>
                            }
                          </div>
                        </Collapse>
                      </div>
                    ) : null
                  }

                  <div className={styles.argumentTitle}>
                    <input {...register('argumentTitle')} type="text" placeholder='arg title' />
                  </div>

                  {
                    isArgumentEditorReady ? (
                      <ArgumentEditor
                        additionalPlugins={
                          <ExportContentPlugin ref={exportEditorContentRef} />
                        }
                        configOptions={prefilledEditorContent ? { editorState: prefilledEditorContent } : undefined}
                      />
                    ) : null
                  }

                  <div className={styles.argumentButtons}>
                    <button type='submit'>Submit</button>
                    <button data-is-draft={true} type='submit'>{isUpdatingDraft ? 'Update' : 'Save'} Draft</button>
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