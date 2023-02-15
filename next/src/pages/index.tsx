import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import Layout from '@/components/Layout/Layout'
import Login, { LoginData } from '@/components/Login/Login'
import Register from '@/components/Register/Register'

export default function Home() {
  return (
    <Layout>
      <Login />

      <Register />
    </Layout>
  )
}
