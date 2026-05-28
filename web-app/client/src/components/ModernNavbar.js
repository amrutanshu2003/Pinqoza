import React from 'react';
import Navbar from './Navbar';

const ModernNavbar = ({ user, onLogout }) => {
  return <Navbar user={user} onLogout={onLogout} />;
};

export default ModernNavbar;
