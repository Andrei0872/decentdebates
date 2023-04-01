import React from 'react'
import styles from '@/styles/Contribute.module.scss';
import Layout from '@/components/Layout/Layout';
import SimpleCollapse from '@/components/SimpleCollapse/SimpleCollapse';

function Contribute() {
  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.header}>
          <p className={styles.description}>
            <span>DecentDebates</span> is a community effort. If you’d like to be part of this community of dedicated and wonderful people, here are a few ways to do that:
          </p>
        </section>

        <section className={styles.body}>

          <SimpleCollapse
            header={<p className={styles.collapseHeader}>Be respectful to others</p>}
          >
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eveniet, quas?
          </SimpleCollapse>

          <SimpleCollapse
            header={<p className={styles.collapseHeader}>Leave a suggestion/complaint</p>}
          >
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eveniet, quas?
          </SimpleCollapse>

          <SimpleCollapse
            header={<p className={styles.collapseHeader}>Become a moderator</p>}
          >
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eveniet, quas?
          </SimpleCollapse>

          <SimpleCollapse
            header={<p className={styles.collapseHeader}>Take part into debates</p>}
          >
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eveniet, quas?
          </SimpleCollapse>
        </section>
      </div>
    </Layout>
  )
}

export default Contribute