import { setCurrentUser } from "@/store/slices/user.slice";
import { api } from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/utils/hooks/store";
import { redirect } from "next/navigation";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form"

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
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="text" {...register('emailOrUsername')} />
        <input type="password" {...register('password')} />

        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default Login