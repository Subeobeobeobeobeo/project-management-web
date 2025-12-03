// src/components/Header.js
import React from 'react';

function Header() {
  return (
    <header style={{
      height: '60px',
      backgroundColor: '#96deffff',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      color: '#ff4d4f', // màu đỏ
      fontWeight: 'bold',
      fontSize: '20px'
    }}>
      Sales Management
    </header>
  );
}

export default Header;