import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DebatePageClient } from './DebatePageClient';
import { CurrentDebate } from '@/store/slices/debates.slice';
import { getDebateDTO } from '@/dtos/debate/get-debate.dto';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DebatePage({ params }: Props) {
  const { id } = await params;

  if (!id || isNaN(+id)) {
    redirect('/');
  }

  const cookieStore = await cookies();
  let debateInfo: CurrentDebate | null = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_URL}/debates/${id}`, {
      headers: { cookie: cookieStore.toString() },
      cache: 'no-store',
    });
    const json = await res.json();
    debateInfo = json.data ?? null;
  } catch {
    redirect('/');
  }

  if (!debateInfo) {
    redirect('/');
  }

  debateInfo = getDebateDTO(debateInfo);

  return <DebatePageClient debateInfo={debateInfo} />;
}
