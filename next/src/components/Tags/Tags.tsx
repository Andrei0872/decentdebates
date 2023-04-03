import { Tag } from '@/types/tag'
import styles from './Tags.module.scss'
import { ItemPredicate, ItemRenderer, MultiSelect2 } from '@blueprintjs/select';
import { MenuItem2 } from '@blueprintjs/popover2'
import { ReactNode, useMemo, useState } from 'react';

interface Props {
  debateTags: Tag[];
}

function Tags(props: Props) {
  const { debateTags } = props;

  const [selectedTagsIds, setSelectedTagsIds] = useState<number[]>([]);

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
      />
    )
  }

  const handleItemSelect = (tag: Tag) => {
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

  const selectedTags = useMemo(() => {
    return selectedTagsIds.map(tId => debateTags.find(dt => dt.id === tId)!);
  }, [selectedTagsIds]);

  return (
    <div className={styles.container}>
      <MultiSelect2<Tag>
        items={debateTags}
        itemRenderer={itemRenderer}
        selectedItems={selectedTags}
        onItemSelect={handleItemSelect}
        tagRenderer={tagRenderer}
        tagInputProps={{
          onRemove: handleTagRemove,
        }}
        itemPredicate={filterTag}
        resetOnSelect={true}
        itemsEqual={areTagsEqual}
        noResults={<MenuItem2 disabled={true} text="No results." roleStructure="listoption" />}
      />
    </div>
  )
}

export default Tags