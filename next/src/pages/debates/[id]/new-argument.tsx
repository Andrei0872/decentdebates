import Layout from '@/components/Layout/Layout'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from '@/styles/NewArgument.module.scss';
import ArgumentEditor from '@/components/ArgumentEditor/ArgumentEditor';
import { useForm } from 'react-hook-form';
import ExportContentPlugin, { ExportContentRefData } from '@/components/ArgumentEditor/plugins/ExportContentPlugin';
import { Callout, Collapse, Icon, Intent, Position, Toaster } from '@blueprintjs/core';
import { useAppSelector } from '@/utils/hooks/store';
import { selectCurrentDebate, DebateArgument, ArgumentType } from '@/store/slices/debates.slice';
import { useRouter } from 'next/router';
import { api } from '@/utils/api';
import { default as DebateArgumentCard } from '@/components/DebateArgument/DebateArgument';
import { createArgument, CreateArgumentData } from '@/utils/api/debate';
import { getCorrespondingCounterargumentType } from '@/utils/debate';

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
  const { counterargumentId: counterargumentIdParam } = router.query;

  const isCounterargumentExplicit = !!counterargumentIdParam;

  const crtDebate = useAppSelector(selectCurrentDebate);

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

  const exportEditorContentRef = useRef<ExportContentRefData>(null);

  const toasterRef = useRef<Toaster>(null);

  useEffect(() => {
    if (!crtDebate) {
      router.push('/debates');
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

  const onSubmit = (formData: CreateArgumentFormData) => {
    const editor = exportEditorContentRef.current?.getEditor();

    const createdArgument: CreateArgumentData = {
      title: formData.argumentTitle,
      content: JSON.stringify(editor?.getEditorState()),
      argumentType: formData.argType,
      ...formData.counterargumentId && { counterargumentId: +formData.counterargumentId },
    };
    createArgument(crtDebate?.metadata.debateId!, createdArgument)
      .then(res => {
        toasterRef.current?.show({
          icon: 'tick-circle',
          intent: Intent.SUCCESS,
          message: res.message,
          timeout: 3000,
        });

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

  const redirectToDebate = () => {
    router.push(`/debates/${crtDebate?.metadata.debateId}`);
  }

  const isCounterargument = watch('isCounterargument') === true;
  const counterargumentId = isCounterargument ? watch('counterargumentId') : false;
  const argType = watch('argType');

  const debateArguments = useMemo(() => {
    return crtDebate?.args.filter(arg => arg.argumentType !== argType);
  }, [argType]);

  const fetchCounterargument = async () => {
    const debateId = router.query.id;
    const arg = (await api.get(`debates/${debateId}/argument/${counterargumentId}`)).data.data;
    setCounterargument(arg);
  }

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
      fetchCounterargument();
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

    fetchCounterargument();
  }

  const unexpandedArg = useMemo(() => {
    if (!counterargumentId) {
      return null;
    }

    return crtDebate?.args.find(arg => +arg.argumentId === +counterargumentId);
  }, [counterargumentId]);

  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.buttons}>
          <button onClick={redirectToDebate} type='button'>
            Back to debate
          </button>
        </section>

        <section className={styles.titleContainer}>
          <h2 className={styles.title}>Adding a new argument</h2>
        </section>

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

            {/* TODO: pass `className` as prop? */}
            <ArgumentEditor
              additionalPlugins={
                <ExportContentPlugin ref={exportEditorContentRef} />
              }
            />

            <div className={styles.argumentButtons}>
              <button type='submit'>Submit</button>
            </div>
          </form>
        </section>

        <Toaster {...toasterOptions} ref={toasterRef} />
      </div>
    </Layout>
  )
}

export default NewArgument