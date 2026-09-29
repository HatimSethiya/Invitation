import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PublicInvitation from "./pages/public/PublicInvitation";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/i/:slug" element={<PublicInvitation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
