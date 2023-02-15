import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.scss'
import Layout from '@/components/Layout/Layout'
import Login, { LoginData } from '@/components/Login/Login'
import Register from '@/components/Register/Register'
import { useState } from 'react'

const enum FormTypes {
  LOGIN,
  REGISTER,
};

export default function Home() {
  const [formType, setFormType] = useState<FormTypes>(FormTypes.LOGIN);

  const toggleFormType = () => {
    setFormType(formType === FormTypes.LOGIN ? FormTypes.REGISTER : FormTypes.LOGIN);
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.form}>
          <div className={styles.header}>
            {
              formType === FormTypes.LOGIN ? (
                <p>Don't have an account yet? <b className={styles.toggler} onClick={toggleFormType}>Register</b></p>
              ) : (
                <p>Already have an account? <b className={styles.toggler} onClick={toggleFormType}>Log in</b></p>
              )
            }
          </div>

          {
            formType === FormTypes.LOGIN ? <Login /> : <Register />
          }
        </div>
      </div>
    </Layout>
  )
}
