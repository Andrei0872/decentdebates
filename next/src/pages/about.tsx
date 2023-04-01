import Layout from '@/components/Layout/Layout'
import React from 'react'
import styles from '@/styles/About.module.scss'

function About() {
  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.body}>
          <h1 className={styles.title}>About</h1>

          <p className={styles.content}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Est beatae necessitatibus dolores itaque blanditiis, ipsum voluptate corporis odio mollitia quod perferendis maiores culpa totam sunt officiis quidem magnam ab temporibus?
          </p>
        </section>
      </div>
    </Layout>
  )
}

export default About