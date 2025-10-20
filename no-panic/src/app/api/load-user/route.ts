import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const user = await req.json();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/load-user`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    }
  );

  if (!response.ok)
    return NextResponse.json({ error: 'Erro no login' }, { status: 400 });

  const updatedUser = await response.json();

  const res = NextResponse.json(updatedUser);
  res.cookies.set('user', JSON.stringify(updatedUser), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
