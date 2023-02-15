
import { setCurrentUser } from "@/store/slices/user.slice";
import { api } from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/utils/hooks/store";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form"
import styles from '@/styles/shared/form.module.scss';

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

function Register () {
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
    <div className={styles.container}>
      <h2 className={styles.title}>Register</h2>
      
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <input type="text" {...register('email')} />
        <input type="text" {...register('username')} />
        <input type="password" {...register('password')} />

        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default Register