// src/components/ProjectForm.js
import React, { useState } from 'react';

function ProjectForm({ onAddProject }) {
  const [SalesPIC, setSalesPIC] = useState('');
  const [ProjectName, setProjectName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5050/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ SalesPIC, ProjectName }),
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      setSalesPIC('');
      setProjectName('');
      onAddProject?.();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '20px',
        borderRadius: '15px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        background: '#fff',
        margin: '20px'
      }}
    >
      <input
        placeholder="SalesPIC"
        value={SalesPIC}
        onChange={(e) => setSalesPIC(e.target.value)}
        style={{
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          outline: 'none',
          fontSize: '14px'
        }}
      />
      <input
        placeholder="ProjectName"
        value={ProjectName}
        onChange={(e) => setProjectName(e.target.value)}
        style={{
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          outline: 'none',
          fontSize: '14px'
        }}
      />
      <button
        type="submit"
        style={{
          padding: '10px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#C80F2E',
          color: '#fff',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Add Project
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
}

export default ProjectForm;