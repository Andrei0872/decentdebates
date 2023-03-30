import { selectCurrentUser, setCurrentUser, UserRoles } from '@/store/slices/user.slice';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import Link from 'next/link';
import { useRouter } from 'next/router';
import navStyles from './Navbar.module.scss';

function AuthenticatedUserNavItems() {
  return (
    <>
      <li className={navStyles.navbarItem}>
        <Link href='/debates'>Debates</Link>
      </li>
      <li className={navStyles.navbarItem}>
        <Link href='/my-activity'>My Activity</Link>
      </li>
      <li className={navStyles.navbarItem}>
        <Link href='/about'>About</Link>
      </li>
      <li className={navStyles.navbarItem}>
        <Link href='/contribute'>Contribute</Link>
      </li>
    </>
  )
}

function ModeratorNavItems() {
  return (
    <>
      <li className={navStyles.navbarItem}>
        <Link href='/activity'>Activity</Link>
      </li>
    </>
  )
}

function UnauthenticatedUserNavItems() {
  return (
    <>
      <li className={navStyles.navbarItem}>
        <Link href='/debates'>Debates</Link>
      </li>
      <li className={navStyles.navbarItem}>
        <Link href='/about'>About</Link>
      </li>
      <li className={navStyles.navbarItem}>
        <Link href='/contribute'>Contribute</Link>
      </li>
    </>
  )
}

function AdminNavItems() {
  return null;
}

const UNAUTHENTICATED_USER_KEY = 'unauthenticatedUser';

const navbarItemsMap = {
  [UserRoles.USER]: <AuthenticatedUserNavItems />,
  [UserRoles.MODERATOR]: <ModeratorNavItems />,
  [UserRoles.ADMIN]: <AdminNavItems />,
  [UNAUTHENTICATED_USER_KEY]: <UnauthenticatedUserNavItems />
};

function Navbar() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const router = useRouter();

  const logout = () => {
    dispatch(setCurrentUser(null));
    router.push('/');
  }

  const navbarItemsKey = user?.role ?? UNAUTHENTICATED_USER_KEY;
  return (
    <ul className={navStyles.navbar}>
      {navbarItemsMap[navbarItemsKey]}
      <li onClick={logout} className={navStyles.navbarItem}>
        <span>Log out</span>
      </li>
    </ul>
  )
}

export default Navbar