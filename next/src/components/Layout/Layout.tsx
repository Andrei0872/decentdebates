import layoutStyles from './Layout.module.scss';

import Head from 'next/head';
import { ReactNode } from 'react';
import Navbar from '../Navbar/Navbar';

export const SITE_TITLE = 'Decent Debates';

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <div className={layoutStyles.container}>
      <Head>
        <title>{SITE_TITLE}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="A place for healthy debates."
        />
      </Head>

      <header className={layoutStyles.header}>
        <h1 className={layoutStyles.title}>Decent Debates</h1>
        <Navbar />
      </header>

      <main className={layoutStyles.main}>{children}</main>

      <footer className={layoutStyles.footer}>footer</footer>
    </div>
  );
}