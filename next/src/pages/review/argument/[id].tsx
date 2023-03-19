import { selectPreviewedCard } from '@/store/slices/moderator.slice';
import { setCurrentUser } from '@/store/slices/user.slice';
import { useAppDispatch, useAppSelector } from '@/utils/hooks/store';
import { useRouter } from 'next/router'
import { useEffect } from 'react';

function Debate() {
  const router = useRouter()
  const { id } = router.query

  // console.log(id, router.isReady);

  const previewedCard = useAppSelector(selectPreviewedCard);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!previewedCard) {
      router.push('/');
      dispatch(setCurrentUser(null));
    }
  }, []);

  return (
    <div>a</div>
  )
}

export default Debate;