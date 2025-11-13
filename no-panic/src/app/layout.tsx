import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LoadUserProvider } from '@/components/LoadUserProvider/LoadUserProvider';
import { PrimeiroLoginForm } from '@/components/PrimeiroLoginForm/PrimeiroLoginForm';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { User } from '@/context/auth-context';

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
  if (user) {
    return (
      <html lang='pt-BR'>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          {user?.primeiro_login ? <PrimeiroLoginForm user={user} /> : ''}
          <LoadUserProvider />
          {children}
          <ToastContainer position='top-right' autoClose={3000} />
        </body>
      </html>
    );
  }
  return (
    <html lang='pt-BR'>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <ToastContainer position='top-right' autoClose={3000} />
      </body>
    </html>
  );
}
