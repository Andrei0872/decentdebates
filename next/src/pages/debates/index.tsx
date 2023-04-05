import { GetServerSideProps } from "next";
import styles from '@/styles/Debates.module.scss';
import Layout from "@/components/Layout/Layout";
import { api } from '@/utils/api'
import { Debate } from "@/store/slices/debates.slice";
import DebateCard from "@/components/DebateCard/DebateCard";
import Input from "@/components/Input/Input";
import { useMemo, useRef, useState } from "react";
import { Dialog, DialogBody, Intent, Position, Toaster, ToasterInstance, ToastProps } from '@blueprintjs/core';
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import buttonStyles from '@/styles/shared/button.module.scss';
import Tags, { TagsRef } from "@/components/Tags/Tags";
import { createDebate, CreateDebateData, fetchDebatesWithFilters } from "@/utils/api/debate";
import SimpleCollapse from "@/components/SimpleCollapse/SimpleCollapse";
import DebateFilters, { AppliedDebateFilters } from "@/components/DebateFilters/DebateFilters";

interface Props {
  debates: Debate[];
}

interface NewDebateData {
  title: string;
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

  const createDebateTagsRef = useRef<TagsRef | null>(null);

  const onApplyFilters = (filters: AppliedDebateFilters) => {
    fetchDebatesWithFilters({ query: filters.queryTitle, tags: filters.tags })
      .then(debates => setDebates(debates));
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
    if (!createDebateTagsRef.current) {
      return;
    }

    console.log(data);

    console.log(createDebateTagsRef.current?.getSelectedTags());


    setIsDebateModalOpen(false);
    reset();

    const { tags, createdTags } = createDebateTagsRef.current.getSelectedTags();
    const debateData: CreateDebateData = {
      title: data.title,
      createdTags,
      tagsIds: tags.map(t => t.id),
    };
    createDebate(debateData)
      .then(r => {
        toasterRef.current?.show({
          icon: 'tick-circle',
          intent: Intent.SUCCESS,
          message: r.message,
          timeout: 2000,
        });
      });
  }

  const debateTags = useMemo(() => {
    const allTags = debates.flatMap(d => d.tags);

    const uniqueTagIds = new Set();
    return allTags.filter(t => uniqueTagIds.has(t.id) ? false : (uniqueTagIds.add(t.id), true));
  }, []);

  return (
    <Layout>
      <div className={styles.container}>
        <section className={styles.filtersContainer}>

          <DebateFilters
            applyFilters={onApplyFilters}
            debateTags={debateTags}
          />
        </section>

        <section className={styles.debatesContainer}>
          <button
            className={`${styles.createDebateBtn} ${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.contained}`}
            type="button"
            onClick={startDebate}
          >
            Start a debate
          </button>

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

      <Dialog className={styles.createDebateDialog} title="Start a debate" isOpen={isDebateModalOpen} onClose={onStartDebateModalClosed}>
        <DialogBody useOverflowScrollContainer={undefined}>
          <form className={styles.createDebateForm} onSubmit={handleSubmit(onNewDebateSubmit)}>
            <Input
              inputProps={{
                className: styles.createDebateTitle,
                placeholder: 'Debate title..'
              }}
              register={register('title')}
            />

            <Tags
              ref={createDebateTagsRef}
              canCreateTags={true}
              debateTags={debateTags}
            />

            <div>
              <button
                className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.outlined} ${styles.submitDebateBtn}`}
                style={{ background: 'transparent' }}
                type="submit"
              >
                Submit
              </button>
            </div>
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