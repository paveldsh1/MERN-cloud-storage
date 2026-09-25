import { store } from './reducers'
import { Provider } from 'react-redux'
import { createRoot } from 'react-dom/client'
import App from './components/App'

const rootElement = document.getElementById('root')
const root = createRoot(rootElement)

root.render(
	<Provider store={store}>
		<App />
	</Provider>
)