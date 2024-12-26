import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import "./App.css"
import Home from './pages/Home'
import NoPage from './pages/NoPage'
import SignUp from './pages/SignUp'
import Editior from './pages/Editor'
const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='*' element={<NoPage />} />
          <Route path='/signUp' element={<SignUp />} />
          <Route path='/editor/:projectID' element={<Editior />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App