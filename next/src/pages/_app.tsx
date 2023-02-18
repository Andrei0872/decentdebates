import { store } from '@/store'
import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import '@blueprintjs/core/lib/css/blueprint.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  )
}
