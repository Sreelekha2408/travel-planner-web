import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { SignIn } from './components/signin/SignIn'
import Dashboard from './components/dashboard/Dashboard';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" Component={SignIn} />
        <Route path="/dashboard" Component={Dashboard} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
