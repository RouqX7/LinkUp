import { Route,Routes } from 'react-router-dom'
import './global.css'
import { AllUsers, CreatePost, EditPost, Explore, Home, PostDetails, Profile, Saved, UpdateProfile } from './_root/pages'
import SignInForm from './_auth/forms/SignInForm'
import SignUpForm from './_auth/forms/SignUpForm'
import RootLayout from './_root/RootLayout'
import AuthLayout from './_auth/AuthLayout'
import { Toaster } from "@/components/ui/toaster"
import LikedPost from './_root/pages/LikedPost'

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
       <Route path='/explore' element= {<Explore/>} />
       <Route path='/saved' element= {<Saved/>} />
       <Route path='/all-users' element= {<AllUsers/>} />
       <Route path='/create-post' element= {<CreatePost/>} />
       <Route path='/update-post/:id' element= {<EditPost/>} />
       <Route path='/posts/:id' element= {<PostDetails/>} />
       <Route path='/profile/:id/*' element= {<Profile/>} />
       <Route path='/update-profile/:id' element= {<UpdateProfile/>} />
       <Route path='/liked-post' element= {<LikedPost/>} />




       </Route>
        </Routes>

        <Toaster />

    </main>
  )
}

export default App