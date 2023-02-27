import { GetServerSideProps } from "next";
import styles from '@/styles/Debates.module.scss';
import Layout from "@/components/Layout/Layout";
import { api } from '@/utils/api'
import { Debate } from "@/store/slices/debates.slice";
import DebateCard from "@/components/DebateCard/DebateCard";
import Input from "@/components/Input/Input";
import { useRef, useState } from "react";
import { Dialog, DialogBody, Intent, Position, Toaster, ToasterInstance, ToastProps } from '@blueprintjs/core';
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";

interface Props {
  debates: Debate[];
}

interface NewDebateData {
  title: string;
  tagsIds: string;
}

const toasterOptions = {
  autoFocus: false,
  canEscapeKeyClear: true,
  position: Position.TOP,
  usePortal: true,
};

function Debates(props: Props) {
  const [debates, setDebates] = useState(props.debates);
  const [isDebateModalOpen, setIsDebateModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<NewDebateData>();

  const toasterRef = useRef<Toaster>(null);
  const router = useRouter();

  const onSearchInputChange = async (value: string) => {
    const encodedQueryParams = btoa(JSON.stringify({ queryStr: value }));
    const res = (await api.get(`/debates?q=${encodedQueryParams}`)).data.data;

    setDebates(res);
  }

  const redirectToDebatePage = (debate: Debate) => {
    router.push(`${router.asPath}/${debate.id}`);
  }

  const startDebate = () => {
    setIsDebateModalOpen(true);
  }

  const onStartDebateModalClosed = () => {
    setIsDebateModalOpen(false);
  }

  const onNewDebateSubmit = async (data: NewDebateData) => {
    setIsDebateModalOpen(false);
    reset();
    
    const res = (await api.post('/debates', data)).data;
    toasterRef.current?.show({
      icon: 'tick-circle',
      intent: Intent.SUCCESS,
      message: res.message,
      timeout: 2000,
    });
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

        <section className={styles.debatesContainer}>
          <button className={styles.createDebateBtn} type="button" onClick={startDebate}>Start a debate</button>

          <ul className={styles.debates}>
            {
              debates?.length ? (
                debates.map(d => (
                  <li className={styles.debate} onClick={() => redirectToDebatePage(d)} key={d.id}>
                    <DebateCard cardData={d} />
                  </li>
                ))
              ) : <p>No Debates found.</p>
            }
          </ul>
        </section>
      </div>

      <Dialog title="Start a debate" isOpen={isDebateModalOpen} onClose={onStartDebateModalClosed}>
        <DialogBody useOverflowScrollContainer={undefined}>
          <form onSubmit={handleSubmit(onNewDebateSubmit)}>
            <input type="text" {...register('title')} />
            <input type="text`" {...register('tagsIds')} />

            <button type="submit">Submit</button>
          </form>
        </DialogBody>
      </Dialog>

      <Toaster {...toasterOptions} ref={toasterRef} />
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