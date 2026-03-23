import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../shared/context/AuthContext";
import RegisterPage from "../presentation/pages/RegisterPage";
import LoginPage from "../presentation/pages/LoginPage";
import CreateRoomPage from "../presentation/pages/CreateRoomPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/crear-sala" element={<CreateRoomPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;