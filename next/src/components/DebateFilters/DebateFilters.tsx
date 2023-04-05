import { Tag } from "@/types/tag";
import { useRef } from "react";
import Input from "../Input/Input";
import SimpleCollapse from "../SimpleCollapse/SimpleCollapse";
import Tags, { TagsRef } from "../Tags/Tags";
import styles from "./DebateFilters.module.scss";
import buttonStyles from '@/styles/shared/button.module.scss';
import { useForm } from "react-hook-form";

export interface AppliedDebateFilters {
  query?: string;
  tags?: string[];
  tags_match?: string;
}

interface Props {
  debateTags: Tag[];
  applyFilters: (filters: AppliedDebateFilters) => void;
}

function DebateFilters(props: Props) {
  const inputFilterRef = useRef<HTMLInputElement | null>(null);
  const tagFiltersRef = useRef<TagsRef | null>(null);

  const {
    getValues,
    register,
  } = useForm<{ tagsMatchingStrategy: 'all' | 'any' }>({
    defaultValues: {
      tagsMatchingStrategy: 'any',
    },
  });

  const applyFilters = () => {
    const filters: AppliedDebateFilters = {
      query: inputFilterRef.current?.value,
      tags: getFilterTags(),
      tags_match: getValues().tagsMatchingStrategy,
    };
    props.applyFilters(filters);
  }

  const getFilterTags = () => {
    if (!tagFiltersRef.current) {
      return undefined;
    }

    const { tags } = tagFiltersRef.current.getSelectedTags();
    if (!tags.length) {
      return undefined;
    }

    return tags.map(t => t.id.toString());
  }

  return (
    <>
      <div className={styles.input}>
        <Input
          inputRef={inputFilterRef}
          inputProps={{ placeholder: "Search by title..." }}
          onChange={applyFilters}
        />
      </div>

      <SimpleCollapse
        header={<p className={styles.tagsHeader}
        >
          Tags
        </p>}
      >
        <div className={styles.tagsContainer}>
          <Tags
            ref={tagFiltersRef}
            debateTags={props.debateTags}
          />

          <div className={styles.tagsMatchingStrategiesContainer}>
            <div className={styles.radioGroup}>
              <label className={``} htmlFor="all">All</label>
              <input {...register('tagsMatchingStrategy')} type="radio" id="all" value="all" />
            </div>

            <div className={styles.radioGroup}>
              <label className={``} htmlFor="any">Any</label>
              <input {...register('tagsMatchingStrategy')} type="radio" id="any" value="any" />
            </div>
          </div>

          <div className={styles.buttons}>
            <button
              onClick={applyFilters}
              className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.outlined}`}
              type="button"
            >
              Apply filters
            </button>
          </div>
        </div>
      </SimpleCollapse>
    </>
  )
}

export default DebateFilters