import { useAuth } from './context/AuthContext';

function App() {
  const { initialized } = useAuth();

  // Router handles all routing - this component is just a placeholder
  return null;
}

export default App;