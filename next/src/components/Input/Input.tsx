import { debounce } from '@/utils/debounce';
import { useCallback } from 'react';
import styles from './Input.module.scss';
import { InputHTMLAttributes } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form';

interface Props {
  debounceMs?: number;
  inputProps?: InputHTMLAttributes<any>;
  register?: UseFormRegisterReturn;
  onChange?: (v: string) => void;
}

function Input(props: Props) {
  const onChangeDebounced = useCallback(
    debounce((ev: any) => {
      const value = ev.target.value;
      props.onChange?.(value);
    }, 500),
    [],
  );

  return (
    <input
      type="text"
      placeholder='Search...'
      {...props.inputProps}
      {...props.register}
      onChange={onChangeDebounced}
      className={`${styles.input} ${props.inputProps?.className ?? ''}`}
    />
  )
}

export default Input