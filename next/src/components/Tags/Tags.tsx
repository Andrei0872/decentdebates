import { Tag } from '@/types/tag'
import styles from './Tags.module.scss'
import { ItemPredicate, ItemRenderer, MultiSelect2 } from '@blueprintjs/select';
import { MenuItem2 } from '@blueprintjs/popover2'
import React, { ForwardedRef, KeyboardEvent, ReactNode, useImperativeHandle, useMemo, useState } from 'react';

interface Props {
  debateTags: Tag[];
  canCreateTags?: boolean;
}

export interface TagsRef {
  getSelectedTags: () => { tags: Tag[], createdTags: string[] };
}

function Tags(props: Props, ref: ForwardedRef<TagsRef>) {
  const { debateTags: tags } = props;
  const canCreateTags = props.canCreateTags === true;

  const [selectedTagsIds, setSelectedTagsIds] = useState<number[]>([]);
  const [debateTags, setDebateTags] = useState(tags);
  const [createdTagsIds, setCreatedTagsIds] = useState<{ [k: number]: boolean }>({});

  useImperativeHandle(ref, () => ({
    getSelectedTags,
  }));

  const getSelectedTags = () => {
    const existingSelectedTags = selectedTagsIds
      .filter(tId => !createdTagsIds[tId])
      .map(tId => debateTags.find(dt => dt.id === tId)!);
    
    const createdTagsNames = selectedTagsIds
      .filter(tId => !!createdTagsIds[tId])
      .map(tId => debateTags.find(dt => dt.id === tId)!.name);

    return {
      tags: existingSelectedTags,
      createdTags: createdTagsNames,
    }
  };

  const itemRenderer: ItemRenderer<Tag> = (tag, props) => {
    if (!props.modifiers.matchesPredicate) {
      return null;
    }

    return (
      <MenuItem2
        onClick={props.handleClick}
        key={tag.id}
        text={tag.name}
        selected={isTagSelected(tag)}
        onFocus={props.handleFocus}
        elementRef={props.ref}
        roleStructure="listoption"
        shouldDismissPopover={false}
        className={`${styles.tagItem} ${createdTagsIds[tag.id] ? styles.createdItem : ''}`}
      />
    )
  }

  const handleItemSelect = (tag: Tag) => {
    setDebateTags(debateTags => {
      const doesTagExist = !!debateTags.find(dt => dt.id === tag.id);
      if (doesTagExist) {
        return debateTags;
      }

      return [...debateTags, tag];
    });

    setCreatedTagsIds(createdTagsIds => {
      const doesTagExist = !!debateTags.find(dt => dt.id === tag.id);
      if (doesTagExist) {
        return createdTagsIds;
      }

      return {
        ...createdTagsIds,
        [tag.id]: true,
      }
    });

    setSelectedTagsIds((selectedTags) => {
      const isItemSelected = !!selectedTags.find(tId => tId === tag.id);
      if (isItemSelected) {
        return selectedTags.filter(tId => tId !== tag.id);
      }

      return [...selectedTags, tag.id];
    });
  }

  const tagRenderer = (tag: Tag) => {
    return tag.name;
  }

  const deselectTag = (tagIdx: number) => {
    setSelectedTagsIds(selectedTagsIds => {
      return selectedTagsIds.filter((_, idx) => idx !== tagIdx);
    });
  }

  const handleTagRemove = (tag: ReactNode, tagIndex: number) => {
    deselectTag(tagIndex);
  }

  const filterTag: ItemPredicate<Tag> = (query, tag, tagIndex) => {
    const normalizedQuery = query.toLowerCase();
    const normalizedTagName = tag.name.toLowerCase();

    return normalizedTagName.includes(normalizedQuery);
  }

  const isTagSelected = (tag: Tag) => {
    return selectedTagsIds.includes(tag.id);
  }

  const areTagsEqual = (tag1: Tag, tag2: Tag) => {
    return tag1.name.toLowerCase() === tag2.name.toLowerCase();
  }

  const createTag = (query: string): Tag => {
    return {
      id: Date.now(),
      name: query,
    };
  }

  const renderCreatedTag = (
    query: string,
    active: boolean,
    handleClick: React.MouseEventHandler<HTMLElement>
  ) => {
    return (
      <MenuItem2
        icon="add"
        text={`Create "${query}"`}
        roleStructure="listoption"
        active={active}
        onClick={handleClick}
        shouldDismissPopover={false}
      />
    );
  }

  const handleOnClear = () => {
    setSelectedTagsIds([]);
    setCreatedTagsIds({});
    setDebateTags(props.debateTags);
  }

  const selectedTags = useMemo(() => {
    return selectedTagsIds.map(tId => debateTags.find(dt => dt.id === tId)!);
  }, [selectedTagsIds]);

  const handleKeyDown = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
    }
  }

  return (
    <div className={styles.container} onKeyDown={handleKeyDown}>
      <MultiSelect2<Tag>
        items={debateTags}
        itemRenderer={itemRenderer}
        selectedItems={selectedTags}
        onItemSelect={handleItemSelect}
        tagRenderer={tagRenderer}
        tagInputProps={{
          onRemove: handleTagRemove,
          className: styles.tagInputContainer,
          tagProps: (_tagElement, index) => {
            const tag = selectedTags[index];
            const isTagNew = !!createdTagsIds[tag.id];

            return {
              className: `${styles.tag} ${isTagNew ? styles.tagNew : ''}`
            }
          },
        }}
        itemPredicate={filterTag}
        resetOnSelect={true}
        itemsEqual={areTagsEqual}
        noResults={<MenuItem2 disabled={true} text="No results." roleStructure="listoption" />}
        createNewItemFromQuery={canCreateTags ? createTag : undefined}
        createNewItemRenderer={canCreateTags ? renderCreatedTag : undefined}
        onClear={handleOnClear}
        placeholder="Search tags..."
        popoverContentProps={{
          className: styles.tagsPopover,
        }}
        popoverProps={{
          matchTargetWidth: true,
          minimal: true,
        }}
        menuProps={{
          className: styles.tagsMenu
        }}
      />
    </div>
  )
}

export default React.forwardRef(Tags);