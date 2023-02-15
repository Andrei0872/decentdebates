
import { setCurrentUser } from "@/store/slices/user.slice";
import { api } from "@/utils/api";
import { useAppDispatch, useAppSelector } from "@/utils/hooks/store";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form"

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
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="text" {...register('email')} />
        <input type="text" {...register('username')} />
        <input type="password" {...register('password')} />

        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default Register