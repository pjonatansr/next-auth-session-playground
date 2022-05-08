import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { signIn, signOut, useSession } from 'next-auth/react';

export default function Home() {

  const { data: session } = useSession();

  return (
    <div className={styles.container}>
      <Head>
        <title>Next-Auth Session Playground</title>
        <meta name="description" content="Next-Auth Session Playground" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>

        <header>
          <h1>Next-Auth session playground</h1>
        </header>
        <nav>
          <div className={styles.flex}>
            <h2>Login/Logout</h2>
            {
              session ?
                <div className={styles.flexItem} >
                  <button onClick={signOut}>Sign out</button>
                  <button onClick={() => {  }}>Refresh token</button>
                </div>
                :
                ['twitter', 'github'].map(provider => (

                  <div key={provider} className={styles.flexItem}>
                    <button
                      onClick={() => {
                        signIn(provider);
                      }}
                    >
                      {provider}
                    </button>
                  </div>
                ))
            }
          </div>
        </nav>
        <section>
          <h2>Session</h2>
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </section>
      </main>
    </div>
  )
}
