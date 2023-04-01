
import { setCurrentUser } from "@/store/slices/user.slice";
import { api } from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/utils/hooks/store";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form"
import formStyles from '@/styles/shared/form.module.scss';
import styles from './Register.module.scss'
import Input from "../Input/Input";
import buttonStyles from '@/styles/shared/button.module.scss'

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

function Register() {
  const {
    register,
    handleSubmit,
  } = useForm<RegisterData>();

  const dispatch = useAppDispatch();
  const router = useRouter();

  const onSubmit = (data: RegisterData) => {
    api.post('auth/register', data)
      .then(r => r.data.data)
      .then(user => {
        dispatch(setCurrentUser(user));
        router.push('/debates');
      });
  }

  return (
    <div className={formStyles.container}>
      <h2 className={styles.title}>Register</h2>

      <form className={formStyles.form} onSubmit={handleSubmit(onSubmit)}>
        <Input inputProps={{ type: 'email', placeholder: 'Email' }} register={register('email')} />
        <Input inputProps={{ placeholder: 'Username' }} register={register('username')} />
        <Input inputProps={{ type: 'password', placeholder: 'Password' }} register={register('password')} />

        <button
          className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.outlined}`}
          type="submit"
        >
          Submit
        </button>
      </form>
    </div>
  )
}

export default Register