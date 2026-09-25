import {
	applyMiddleware,
	combineReducers,
	legacy_createStore as createStore
} from 'redux'
import { thunk } from 'redux-thunk'
import userReducer from './userReducer'
import fileReducer from './fileReducer'

const rootReducer = combineReducers({
	user: userReducer,
	files: fileReducer
})

const composeEnhancers =
	window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || ((f) => f)

export const store = createStore(
	rootReducer,
	composeEnhancers(
		applyMiddleware(thunk)
	)
)