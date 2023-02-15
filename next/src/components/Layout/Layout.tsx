import layoutStyles from './Layout.module.scss';

import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import Navbar from '../Navbar/Navbar';

export const SITE_TITLE = 'Decent Debates';

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  console.log(layoutStyles);

  return (
    <div>
      <Head>
        <title>{SITE_TITLE}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="A place for healthy debates."
        />
      </Head>

      <header>
        <h1>Decent Debates</h1>
        <Navbar user={null} />
      </header>

      <main>{children}</main>

      <footer>footer</footer>
    </div>
  );
}