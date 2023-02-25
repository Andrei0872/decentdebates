import Layout from '@/components/Layout/Layout'
import React from 'react'
import styles from '@/styles/NewArgument.module.scss';
import ArgumentEditor from '@/components/ArgumentEditor/ArgumentEditor';

function NewArgument() {
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
          <form className={styles.argumentForm}>
            <div className={styles.argumentType}>radio buttons</div>

            <div className={styles.counterargumentCheck}>
              <input type="checkbox" name="" id="" />
              is counterargument for ...select...
            </div>

            {/* TODO: if above checkbox is selected. */}
            <div>
              accordion with counterargument
            </div>

            <div className={styles.argumentTitle}>
              <input type="text" placeholder='arg title' />
            </div>

            {/* TODO: pass `className` as prop? */}
            <ArgumentEditor />

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