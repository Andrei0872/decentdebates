import Layout from '@/components/Layout/Layout'
import React, { useRef, useState } from 'react'
import styles from '@/styles/NewArgument.module.scss';
import ArgumentEditor from '@/components/ArgumentEditor/ArgumentEditor';
import { useForm } from 'react-hook-form';
import ExportContentPlugin, { ExportContentRefData } from '@/components/ArgumentEditor/plugins/ExportContentPlugin';

function NewArgument() {
  const {
    register,
    handleSubmit,
    watch,
    // TODO: types
  } = useForm<any>();

  const [counterarguments, setCounterarguments] = useState([]);

  const exportEditorContentRef = useRef<ExportContentRefData>(null);

  const onSubmit = (formData: any) => {
    console.log(formData);
    const serializedEditorContent = exportEditorContentRef.current?.getEditorContent();
    console.log(JSON.stringify(serializedEditorContent));
  }

  const isCounterargument = watch('isCounterargument') === true;

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

        <section className={styles.argumentContainer}>
          <form className={styles.argumentForm} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.argumentType}>
              <div className={styles.radioGroup}>
                <label htmlFor="pro">Pro</label>
                <input checked={true} type="radio" id="pro" value="pro" {...register('argType')} />
              </div>

              <div className={styles.radioGroup}>
                <label htmlFor="con">Con</label>
                <input type="radio" id="con" value="con" {...register('argType')} />
              </div>
            </div>

            <div className={styles.counterargumentCheck}>
              <input id='counterargumentCheck' type="checkbox" {...register('isCounterargument')} />
              <div className={`${styles.counterargumentSelect} ${isCounterargument ? '' : styles.isDisabled}`}>
                <label htmlFor='counterargumentCheck'>
                  is counterargument for
                </label>

                <select {...register('counterargumentId')} disabled={!isCounterargument}>
                  <option value="1">cArg 1</option>
                  <option value="2">cArg 2</option>
                  <option value="3">cArg 3</option>
                </select>
              </div>
            </div>

            {/* TODO: if above checkbox is selected. */}
            <div>
              accordion with counterargument
            </div>

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