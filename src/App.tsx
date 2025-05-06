// src/App.tsx
import React from 'react';
import WireTransferForm from './components/WireTransferForm'; // Assuming WireTransferForm is now WireTransferForm.tsx

// Ensure Tailwind CSS is imported, typically in your index.tsx or App.css
// For this example, assume Tailwind is globally available via CDN in index.html or similar setup.
// If using a CSS file: import './App.css'; (and ensure Tailwind is processed there)

/**
 * Main application component.
 * Renders the WireTransferForm.
 * @returns {JSX.Element} The rendered App component.
 */
const App: React.FC = (): JSX.Element => {
  return (
    // The WireTransferForm component already includes a full-page background and centering.
    // So, no extra layout needed here unless you have other app components like a navbar.
    <WireTransferForm />
  );
}

export default App;
