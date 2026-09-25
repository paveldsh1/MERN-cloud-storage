import axios from 'axios'
import { setUser } from "../reducers/userReducer"

export const registration = async (email, password) => {
    try {
        const response = await axios.post(
            'http://localhost:3001/api/auth/registration',
            {
                email,
                password
            }
        )

        alert(response.data.message)
    } catch (e) {
        console.log(e)

        const message =
            e.response?.data?.message ||
            e.message ||
            'Ошибка регистрации'

        alert(message)
    }
}

export const login = (email, password) => {
    return async dispatch => {
        try {
            const response = await axios.post(
                'http://localhost:3001/api/auth/login',
                {
                    email,
                    password
                }
            )

            dispatch(setUser(response.data.user))
            localStorage.setItem('token', response.data.token)
        } catch (e) {
            console.log(e)

            const message =
                e.response?.data?.message ||
                e.message ||
                'Ошибка авторизации'

            alert(message)
        }
    }
}

export const auth = () => {
    return async dispatch => {
        try {
            const response = await axios.get(
                'http://localhost:3001/api/auth/auth',
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            )

            dispatch(setUser(response.data.user))
            localStorage.setItem('token', response.data.token)

        } catch (e) {
            console.log('AUTH ERROR:', e)
            console.log('AUTH MESSAGE:', e.message)
            console.log('AUTH RESPONSE:', e.response)

            const message =
                e.response?.data?.message ||
                e.message ||
                'Ошибка авторизации'

            alert(message)

            localStorage.removeItem('token')
        }
    }
}