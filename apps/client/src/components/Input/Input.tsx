import { debounce } from '@/utils/debounce';
import { ChangeEvent, InputHTMLAttributes, Ref, useMemo } from 'react';
import styles from './Input.module.scss';
import { UseFormRegisterReturn } from 'react-hook-form';

interface Props {
  debounceMs?: number;
  inputProps?: InputHTMLAttributes<any>;
  register?: UseFormRegisterReturn;
  inputRef?: Ref<HTMLInputElement>
  onChange?: (v: string) => void;
}

function Input(props: Props) {
  const { debounceMs, inputProps, inputRef, onChange, register } = props;

  const onChangeDebounced = useMemo(() => {
    return debounce((ev: ChangeEvent<HTMLInputElement>) => {
      const value = ev.target.value;
      onChange?.(value);
    }, debounceMs ?? 500);
  }, [debounceMs, onChange]);

  return (
    <input
      type="text"
      placeholder='Search...'
      {...inputProps}
      onChange={onChangeDebounced}
      className={`${styles.input} ${inputProps?.className ?? ''}`}
      ref={inputRef ?? null}
      {...register}
    />
  )
}

export default Input
