import { cookies } from 'next/headers';
import { DebatesClient } from './DebatesClient';
import { Debate } from '@/store/slices/debates.slice';

export default async function DebatesPage() {
  const cookieStore = await cookies();
  let debates: Debate[] = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_URL}/debates`, {
      headers: { cookie: cookieStore.toString() },
      cache: 'no-store',
    });
    const json = await res.json();
    debates = json.data ?? [];
  } catch {
    debates = [];
  }

  return <DebatesClient debates={debates} />;
}
