import { Tag } from '@/types/tag'
import styles from './Tags.module.scss'
import { ItemRenderer, MultiSelect2 } from '@blueprintjs/select';
import { MenuItem2 } from '@blueprintjs/popover2'
import { useMemo, useState } from 'react';

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
      />
    )
  }

  const handleItemSelect = (tag: Tag) => {
    setSelectedTagsIds((selectedTags) => {
      debugger;
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
      />
    </div>
  )
}

export default Tags