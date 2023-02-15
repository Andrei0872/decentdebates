import { setCurrentUser } from "@/store/slices/user.slice";
import { api } from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/utils/hooks/store";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form"
import styles from '@/styles/shared/form.module.scss';

export interface LoginData {
  emailOrUsername: string;
  password: string;
}

function Login () {
  const {
    register,
    handleSubmit,
  } = useForm<LoginData>();

  const dispatch = useAppDispatch();
  const router = useRouter();

  const onSubmit = (data: LoginData) => {
    api.post('auth/login', data)
      .then(r => r.data.data)
      .then(user => {
        dispatch(setCurrentUser(user));
        router.push('/debates');
      });
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Login</h2>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <input type="text" {...register('emailOrUsername')} />
        <input type="password" {...register('password')} />

        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default Login