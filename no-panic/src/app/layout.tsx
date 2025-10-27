import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LoadUserProvider } from '@/components/LoadUserProvider/LoadUserProvider';
import { PrimeiroLoginForm } from '@/components/PrimeiroLoginForm/PrimeiroLoginForm';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'No Panic',
  description: 'Plataforma para conversas e terapia online',
  icons: '/logo_sf.png',
  openGraph: {
    images: ['/logo.png'],
    title: 'No Panic',
    description: 'Plataforma para conversas e terapia online',
  },
};

export interface User {
  id: number;
  email: string;
  senha: string;
  primeiro_login: number;
}

const loadUser = async () => {
  const cookie = await cookies();
  const cookieUser = cookie.get('user');
  let user: User | undefined;
  if (cookieUser) {
    try {
      user = JSON.parse(cookieUser.value) as User;
    } catch {
      user = undefined;
    }
  }

  if (user) {
    return user;
  }
};

const load = async (email: string) => {
  if (!email) return;

  const data = {
    email,
  };

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/load-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Erro ao entrar');
    }
    const { usuario } = await response.json();
    return usuario;
  } catch (err) {
    console.error(err);
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await loadUser();
  if (user) {
    const usuario = await load(user?.email);
    return (
      <html lang='en'>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          {usuario?.primeiro_login === 1 ? (
            <h1>{<PrimeiroLoginForm user={user} />}</h1>
          ) : (
            ''
          )}
          <LoadUserProvider />
          {children}
        </body>
      </html>
    );
  }
}
