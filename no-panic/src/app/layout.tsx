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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await loadUser();
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* {user?.primeiro_login === 1 ? (
          <h1>{<PrimeiroLoginForm user={user} />}</h1>
        ) : (
          ''
        )} */}
        <LoadUserProvider />
        {children}
      </body>
    </html>
  );
}
