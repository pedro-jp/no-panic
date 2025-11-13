import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from '@/context/auth-context';
import { PrimeiroLoginForm } from '@/components/PrimeiroLoginForm/PrimeiroLoginForm';
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

// SSR — lê cookie do servidor
async function loadUser(): Promise<User | null> {
  const cookieStore = cookies();
  const cookieUser = (await cookieStore).get('user');
  if (!cookieUser) return null;

  try {
    return JSON.parse(cookieUser.value) as User;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await loadUser();

  return (
    <html lang='pt-BR'>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          {user?.nome}
          {user?.primeiro_login ? <PrimeiroLoginForm user={user} /> : null}
          {children}
          <ToastContainer position='top-right' autoClose={3000} />
        </AuthProvider>
      </body>
    </html>
  );
}
