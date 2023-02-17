import { GetServerSideProps } from "next";
import styles from '@/styles/Debates.module.scss';
import Layout from "@/components/Layout/Layout";
import { api } from '@/utils/api'
import { Debate } from "@/store/slices/debates.slice";
import DebateCard from "@/components/DebateCard/DebateCard";
import Input from "@/components/Input/Input";
import { useDispatch } from "react-redux";
import { useState } from "react";

interface Props {
  debates: Debate[];
}

function Debates(props: Props) {
  const [debates, setDebates] = useState(props.debates);

  const onSearchInputChange = async (value: string) => {
    const encodedQueryParams = btoa(JSON.stringify({ queryStr: value }));
    const res = (await api.get(`/debates?q=${encodedQueryParams}`)).data.data;

    setDebates(res);
  }

  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.search}>
          <div className={styles.input}>
            <Input onChange={onSearchInputChange} />
          </div>

          <div className={styles.tags}>
            tags
            <button type="button">
              Apply
            </button>
          </div>

        </section>

        <section className={styles.debates}>
          {
            debates?.length ? (
              debates.map(d => (
                <DebateCard key={d.id} cardData={d} />
              ))
            ) : <p>No Debates found.</p>
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