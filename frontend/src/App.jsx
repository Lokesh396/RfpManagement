import { Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Vendors from './pages/Vendors'
import {BrowserRouter} from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import CreateRFP from './pages/CreateRFP'
import AllRFP from './pages/AllRFP'
import RFPDetail from './pages/RFPDetail'

function App() {

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} >
          <Route path='/' element={<CreateRFP />} />
          <Route  path='/vendors' element={<Vendors />} />
          <Route path='/rfps' element={<AllRFP />} />
          <Route path='/rfps/:id' element={<RFPDetail />} />
        </Route>
      </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  )
}

export default App
