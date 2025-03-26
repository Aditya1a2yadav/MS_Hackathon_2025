import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import axios from 'axios';

const App = () => {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    axios.get('/api/auth/user', { withCredentials: true })
      .then(response => {
        if(response.data.user) {
          setUser(response.data.user);
        }
      })
      .catch(err => console.log(err));
  }, []);

  const renderPage = () => {
    switch(page) {
      case 'home':
        return <Home setPage={setPage} currentPage={page}/>;
      case 'dashboard':
        return <Dashboard user={user} />;
      default:
        return <Home setPage={setPage} currentPage={page}/>;
    }
  };

  return (
    <div className="app-container">
      <Navbar setPage={setPage} currentPage={page} user={user} setUser={setUser} />
      <main className="app-main">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
