import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow w-full p-0 sm:container sm:mx-auto sm:px-4 py-4 sm:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;