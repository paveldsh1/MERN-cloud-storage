import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './navbar/Navbar'
import './app.css'
import Registration from './registration/Registration'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />

        <Routes>
          <Route
            path="/registration"
            element={<Registration />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App