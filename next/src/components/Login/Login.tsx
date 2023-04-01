import { selectCurrentUser, setCurrentUser, User, UserRoles } from "@/store/slices/user.slice";
import { api } from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/utils/hooks/store";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form"
import formStyles from '@/styles/shared/form.module.scss';
import { useEffect } from "react";
import Input from "../Input/Input";
import buttonStyles from '@/styles/shared/button.module.scss'
import styles from './Login.module.scss';

export interface LoginData {
  emailOrUsername: string;
  password: string;
}

function Login() {
  const {
    register,
    handleSubmit,
  } = useForm<LoginData>();

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const router = useRouter();

  useEffect(() => {
    if (!!user) {
      router.back();
      return;
    }
  }, []);


  const onSubmit = (data: LoginData) => {
    api.post('auth/login', data)
      .then(r => r.data.data)
      .then((user: User) => {
        dispatch(setCurrentUser(user));

        switch (user?.role) {
          case UserRoles.USER: {
            router.push('/debates');
            return;
          }
          case UserRoles.MODERATOR: {
            router.push('/activity');
            return;
          }
          case UserRoles.ADMIN: {
            return;
          }
        }
      });
  }

  return (
    <div className={formStyles.container}>
      <h2 className={styles.title}>Login</h2>

      <form className={formStyles.form} onSubmit={handleSubmit(onSubmit)}>
        <Input inputProps={{ placeholder: 'Email or username' }} register={register('emailOrUsername')} />
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

export default Login