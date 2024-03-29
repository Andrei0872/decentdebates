import { debounce } from '@/utils/debounce';
import { Ref, useCallback } from 'react';
import styles from './Input.module.scss';
import { InputHTMLAttributes } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form';

interface Props {
  debounceMs?: number;
  inputProps?: InputHTMLAttributes<any>;
  register?: UseFormRegisterReturn;
  inputRef?: Ref<HTMLInputElement>
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
      onChange={onChangeDebounced}
      className={`${styles.input} ${props.inputProps?.className ?? ''}`}
      ref={props.inputRef ?? null}
      {...props.register}
    />
  )
}

export default Input