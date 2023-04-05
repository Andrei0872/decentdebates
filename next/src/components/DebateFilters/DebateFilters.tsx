import { Tag } from "@/types/tag";
import { useRef } from "react";
import Input from "../Input/Input";
import SimpleCollapse from "../SimpleCollapse/SimpleCollapse";
import Tags, { TagsRef } from "../Tags/Tags";
import styles from "./DebateFilters.module.scss";
import buttonStyles from '@/styles/shared/button.module.scss';

export interface AppliedDebateFilters {
  queryTitle?: string;
  tags?: string[];
}

interface Props {
  debateTags: Tag[];
  applyFilters: (filters: AppliedDebateFilters) => void;
}

function DebateFilters(props: Props) {
  const inputFilterRef = useRef<HTMLInputElement | null>(null);
  const tagFiltersRef = useRef<TagsRef | null>(null);

  const applyFilters = () => {
    const filters: AppliedDebateFilters = {
      queryTitle: inputFilterRef.current?.value,
      tags: getFilterTags(),
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
        </p>}>
        <div className={styles.tagsContainer}>
          <Tags
            ref={tagFiltersRef}
            debateTags={props.debateTags}
          />

          <button
            onClick={applyFilters}
            className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.outlined}`}
            type="button"
          >
            Apply filters
          </button>
        </div>
      </SimpleCollapse>
    </>
  )
}

export default DebateFilters