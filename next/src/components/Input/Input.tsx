import { debounce } from '@/utils/debounce';
import { useCallback } from 'react';
import styles from './Input.module.scss';
import { InputHTMLAttributes } from 'react'

interface Props {
  debounceMs?: number;
  inputProps?: InputHTMLAttributes<any>;
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
    <input className={styles.input} type="text" placeholder='Search...' {...props.inputProps} onChange={onChangeDebounced} />
  )
}

export default Input