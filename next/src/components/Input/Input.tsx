import { debounce } from '@/utils/debounce';
import { useCallback } from 'react';
import styles from './Input.module.scss';

interface Props {
  debounceMs?: number;
  onChange: (v: string) => void;
}

function Input(props: Props) {
  const onChangeDebounced = useCallback(
    debounce((ev: any) => {
      const value = ev.target.value;
      props.onChange(value);
    }, 500),
    [],
  );

  return (
    <div>
      <input type="text" placeholder='Search' onChange={onChangeDebounced} />
    </div>
  )
}

export default Input