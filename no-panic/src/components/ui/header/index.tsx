'use client';

import React from 'react';
import styles from './styles.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { IoClose, IoHeart, IoMenu } from 'react-icons/io5';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { BiLogOut, BiUser } from 'react-icons/bi';
import { redirect } from 'next/navigation';

export const HeaderComponent = () => {
  const { user, logout } = useAuth();
  return (
    <header className={styles.header}>
      <menu>
        <div className={styles.burger}>
          <input type='checkbox' name='burger' id='burger' />
          <IoMenu className={styles.closed} />
          <IoClose className={styles.open} />
        </div>
        <Link href='/' className={styles.logo}>
          <Image src='/logo_azul_sf.png' alt='logo' height={30} width={30} />
          <h4>No Panic</h4>
        </Link>
        <ul>
          <li>
            <Link href='/terapeutas'>Terapeutas</Link>
          </li>
          {user?.terapeuta?.CRP ? (
            <li>
              <Link href='/pacientes'>Pacientes</Link>
            </li>
          ) : (
            <li>
              <Link href='/favoritos'>Favoritos</Link>
            </li>
          )}
          <li>
            <Link
              href='/sessoes
            '
            >
              Sessões
            </Link>
          </li>
          <li>
            <Link href='#'>Histórico</Link>
          </li>
          <li>
            <Link href='#'>Chat</Link>
          </li>
        </ul>
        <div className={styles.sos_perfil}>
          <button className={styles.sos_btn}>
            <IoHeart color='red' />
            sos
          </button>
          <div className={styles.config}>
            <Image src='/logo.png' alt='Perfil' width={20} height={20} />
            <ul className={styles.content}>
              <li>
                <Link href={'/perfil'}>
                  <button>
                    <BiUser /> Perfil
                  </button>
                </Link>
              </li>
              <li>
                <button onClick={() => logout()}>
                  <BiLogOut /> Sair
                </button>
              </li>
            </ul>
          </div>
        </div>
      </menu>
      <nav>
        <ul className={styles.ul_mobile}>
          <li>
            <Link href='/terapeutas'>Terapeutas</Link>
          </li>
          <li>
            <Link href='/favoritos'>Favoritos</Link>
          </li>
          <li>
            <Link href='/calendario'>Calendário</Link>
          </li>
          <li>
            <Link href='#'>Histórico</Link>
          </li>
          <li>
            <Link href='#'>Chat</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export function Header() {
  return (
    <AuthProvider>
      <HeaderComponent />
    </AuthProvider>
  );
}
