import { Route,Routes } from 'react-router-dom'
import './global.css'
import { Home } from './_root/pages'
import SignInForm from './_auth/forms/SignInForm'
import SignUpForm from './_auth/forms/SignUpForm'
import RootLayout from './_root/RootLayout'
import AuthLayout from './_auth/AuthLayout'
import { Toaster } from "@/components/ui/toaster"

const App = () => {
  return (
    <main className='flex h-screen'>
        <Routes>
            {/* Public routes */}
            <Route element= {<AuthLayout />}>
            <Route path='/sign-in' element= {<SignInForm/>} />
            <Route path='/sign-up' element= {<SignUpForm/>} />
            </Route>

       {/* Private Routes */}
       <Route element={<RootLayout/>}>
       <Route index element={<Home/>}/>
       </Route>
        </Routes>

        <Toaster />

    </main>
  )
}

export default App