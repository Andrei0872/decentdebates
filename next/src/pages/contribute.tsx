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
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Laudantium nemo aliquid facilis quas nostrum iste quidem deleniti labore tempore molestias?
          </SimpleCollapse>

          <SimpleCollapse
            header={<p className={styles.collapseHeader}>Leave a suggestion/complaint</p>}
          >
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Veritatis illum expedita neque consequuntur provident quibusdam, asperiores cum illo at nostrum. Dolore natus eveniet asperiores porro iure culpa corrupti, in reiciendis enim aperiam consectetur ad harum quos non eligendi, accusamus optio?
          </SimpleCollapse>

          <SimpleCollapse
            header={<p className={styles.collapseHeader}>Become a moderator</p>}
          >
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nesciunt est exercitationem, adipisci asperiores tempora incidunt, quis minus, aperiam quod et dolores facilis fuga at voluptatibus?
          </SimpleCollapse>

          <SimpleCollapse
            header={<p className={styles.collapseHeader}>Take part into debates</p>}
          >
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam ab reprehenderit id expedita eos voluptatibus quis non illum. Reprehenderit recusandae impedit numquam nisi, cum voluptatibus autem molestias consectetur minus ab quisquam nulla alias sit saepe blanditiis ullam velit harum tempora excepturi distinctio soluta? Corrupti nesciunt expedita magnam, eaque minima quidem.
          </SimpleCollapse>
        </section>
      </div>
    </Layout>
  )
}

export default Contribute