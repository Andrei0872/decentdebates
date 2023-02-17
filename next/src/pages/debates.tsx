import { GetServerSideProps } from "next";
import styles from '@/styles/Debates.module.scss';
import Layout from "@/components/Layout/Layout";
import { api } from '@/utils/api'
import { Debate } from "@/store/slices/debates.slice";
import DebateCard from "@/components/DebateCard/DebateCard";

interface Props {
  debates: Debate[];
}

function Debates(props: Props) {
  const { debates } = props;

  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.search}>
          <div className={styles.input}>
            <input type="text" placeholder="Search..." />
          </div>

          <div className={styles.tags}>
            tags
          </div>

          <button type="button">
            Apply
          </button>
        </section>

        <section className={styles.debates}>
          {
            debates?.length ? (
              debates.map(d => (
                <DebateCard key={d.id} cardData={d} />
              ))
            ) : <p>No Debates yet</p>
          }
        </section>
      </div>
    </Layout>
  )
}

export default Debates;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await api.get('/debates', {
    withCredentials: true,
    headers: {
      cookie: context.req.headers.cookie,
    },
  });
  const debates = res.data?.data;

  return {
    props: {
      debates,
    },
  }
}