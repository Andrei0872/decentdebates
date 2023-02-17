import { GetServerSideProps } from "next";
import styles from '@/styles/Debates.module.scss';
import Layout from "@/components/Layout/Layout";
import { api } from '@/utils/api'
import { Debate } from "@/store/slices/debates.slice";

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
            {/* <Input placeholder="Seach..." /> */}
          </div>

          <div className={styles.tags}>
            tags
          </div>

          {/* <Button type="primary" size="small">
            Apply */}
          {/* </Button> */}
        </section>

        <section className={styles.debates}>
          debates
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
  const debates = res.data;

  return {
    props: {
      debates,
    },
  }
}