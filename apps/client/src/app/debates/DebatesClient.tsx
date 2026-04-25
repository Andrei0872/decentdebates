"use client";

import styles from "@/styles/Debates.module.scss";
import Layout from "@/components/Layout/Layout";
import { Debate } from "@/store/slices/debates.slice";
import DebateCard from "@/components/DebateCard/DebateCard";
import Input from "@/components/Input/Input";
import { useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogBody,
  Intent,
  OverlayToaster,
  Position,
} from "@blueprintjs/core";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import buttonStyles from "@/styles/shared/button.module.scss";
import Tags, { TagsRef } from "@/components/Tags/Tags";
import {
  createDebate,
  CreateDebateData,
  fetchDebatesWithFilters,
} from "@/utils/api/debate";
import DebateFilters, {
  AppliedDebateFilters,
} from "@/components/DebateFilters/DebateFilters";
import { useAppSelector } from "@/utils/hooks/store";
import { selectCurrentUser } from "@/store/slices/user.slice";
import { Tag } from "@/types/tag";

interface NewDebateData {
  title: string;
}

const toasterOptions = {
  autoFocus: false,
  canEscapeKeyClear: true,
  position: Position.TOP,
  usePortal: true,
};

interface Props {
  debates: Debate[];
}

export function DebatesClient(props: Props) {
  const [debates, setDebates] = useState(props.debates);
  const [isDebateModalOpen, setIsDebateModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<NewDebateData>();

  const toasterRef = useRef<OverlayToaster>(null);
  const router = useRouter();

  const user = useAppSelector(selectCurrentUser);

  const createDebateTagsRef = useRef<TagsRef | null>(null);

  const onApplyFilters = (filters: AppliedDebateFilters) => {
    fetchDebatesWithFilters(filters).then((debates) => setDebates(debates));
  };

  const redirectToDebatePage = (debate: Debate) => {
    router.push(`/debates/${debate.id}`);
  };

  const startDebate = () => {
    setIsDebateModalOpen(true);
  };

  const onStartDebateModalClosed = () => {
    setIsDebateModalOpen(false);
  };

  const onNewDebateSubmit = async (data: NewDebateData) => {
    if (!createDebateTagsRef.current) {
      return;
    }

    setIsDebateModalOpen(false);
    reset();

    const { tags, createdTags } = createDebateTagsRef.current.getSelectedTags();
    const debateData: CreateDebateData = {
      title: data.title,
      createdTags,
      tagsIds: tags.map((t: Tag) => t.id),
    };
    createDebate(debateData).then((r) => {
      toasterRef.current?.show({
        icon: "tick-circle",
        intent: Intent.SUCCESS,
        message: r.message,
        timeout: 2000,
      });
    });
  };

  const debateTags = useMemo(() => {
    const allTags = debates.flatMap((d) => d.tags);

    const uniqueTagIds = new Set();
    return allTags.filter((t) =>
      uniqueTagIds.has(t.id) ? false : (uniqueTagIds.add(t.id), true),
    );
  }, [debates]);

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
          {!!user ? (
            <button
              className={`${styles.createDebateBtn} ${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.contained}`}
              type="button"
              onClick={startDebate}
            >
              Start a debate
            </button>
          ) : null}

          <ul data-testid="debates-list" className={styles.debates}>
            {debates?.length ? (
              debates.map((d) => (
                <li
                  className={styles.debate}
                  onClick={() => redirectToDebatePage(d)}
                  key={d.id}
                >
                  <DebateCard cardData={d} />
                </li>
              ))
            ) : (
              <p>No Debates found.</p>
            )}
          </ul>
        </section>
      </div>

      <Dialog
        className={styles.createDebateDialog}
        title="Start a debate"
        isOpen={isDebateModalOpen}
        onClose={onStartDebateModalClosed}
      >
        <DialogBody useOverflowScrollContainer={undefined}>
          <form
            className={styles.createDebateForm}
            onSubmit={(event) => void handleSubmit(onNewDebateSubmit)(event)}
          >
            <Input
              inputProps={{
                className: styles.createDebateTitle,
                placeholder: "Debate title..",
              }}
              register={register("title")}
            />

            <Tags
              ref={createDebateTagsRef}
              canCreateTags={true}
              debateTags={debateTags}
            />

            <div>
              <button
                className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.outlined} ${styles.submitDebateBtn}`}
                style={{ background: "transparent" }}
                type="submit"
              >
                Submit
              </button>
            </div>
          </form>
        </DialogBody>
      </Dialog>

      <OverlayToaster {...toasterOptions} ref={toasterRef} />
    </Layout>
  );
}
