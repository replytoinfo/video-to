
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize dark mode on load
function setInitialTheme() {
  const storedTheme = localStorage.getItem("theme");
  
  if (storedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (storedTheme === "light") {
    document.documentElement.classList.add("light");
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.add("light");
    localStorage.setItem("theme", "light");
  }
}

// Run before React renders
setInitialTheme();

createRoot(document.getElementById("root")!).render(<App />);
