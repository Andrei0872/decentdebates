import Layout from '@/components/Layout/Layout'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from '@/styles/NewArgument.module.scss';
import ArgumentEditor from '@/components/ArgumentEditor/ArgumentEditor';
import { useForm } from 'react-hook-form';
import ExportContentPlugin, { ExportContentRefData } from '@/components/ArgumentEditor/plugins/ExportContentPlugin';
import { Callout, Collapse, Icon } from '@blueprintjs/core';
import { useAppSelector } from '@/utils/hooks/store';
import { selectCurrentDebate, DebateArgument } from '@/store/slices/debates.slice';
import { useRouter } from 'next/router';
import { api } from '@/utils/api';
import { default as DebateArgumentCard } from '@/components/DebateArgument/DebateArgument';

function NewArgument() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<any>({
    defaultValues: {
      argType: 'PRO',
    },
  });

  const [isCounterargumentExpanded, setIsCounterargumentExpanded] = useState(false);
  const [counterargument, setCounterargument] = useState<DebateArgument | null>(null);

  const exportEditorContentRef = useRef<ExportContentRefData>(null);

  const router = useRouter();

  const crtDebate = useAppSelector(selectCurrentDebate);

  useEffect(() => {
    if (!crtDebate) {
      router.push('/debates');
    }
  }, []);

  const onSubmit = (formData: any) => {
    console.log(formData);
    const serializedEditorContent = exportEditorContentRef.current?.getEditorContent();
    console.log(JSON.stringify(serializedEditorContent));
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
    setValue('counterargumentId', null);
  }, [argType]);

  useEffect(() => {
    if (!isCounterargument) {
      setValue('counterargumentId', null);
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
          <button type='button'>
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
              <input id='counterargumentCheck' type="checkbox" {...register('isCounterargument')} />
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
      </div>
    </Layout>
  )
}

export default NewArgument