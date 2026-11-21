import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import WeddingStudioHome from "./pages/admin/WeddingStudioHome";
import TemplateGallery from "./pages/admin/TemplateGallery";
import StudioCardEditor from "./pages/admin/StudioCardEditor";
import InvitationWizard from "./pages/admin/InvitationWizard";
import PublicInvitation from "./pages/public/PublicInvitation";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/studio" element={<WeddingStudioHome />} />
            <Route path="/admin/studio/templates" element={<TemplateGallery />} />
            <Route path="/admin/studio/create/:templateId" element={<StudioCardEditor />} />
            <Route path="/admin/studio/drafts/:draftId/edit" element={<StudioCardEditor />} />
            <Route path="/admin/invitations/new" element={<InvitationWizard />} />
            <Route path="/admin/invitations/:id/edit" element={<InvitationWizard />} />
          </Route>
          <Route path="/i/:slug" element={<PublicInvitation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
