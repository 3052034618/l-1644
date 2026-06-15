import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Layout from "@/components/Layout";
import ClientWorkspace from "@/pages/client/ClientWorkspace";
import CreateProject from "@/pages/client/CreateProject";
import ProjectDetail from "@/pages/client/ProjectDetail";
import Complaints from "@/pages/client/Complaints";
import ManagerCenter from "@/pages/manager/ManagerCenter";
import TaskAssignment from "@/pages/manager/TaskAssignment";
import MemberManagement from "@/pages/manager/MemberManagement";
import Reports from "@/pages/manager/Reports";
import AnnotatorWorkspace from "@/pages/annotator/AnnotatorWorkspace";
import AnnotationTask from "@/pages/annotator/AnnotationTask";
import ReviewerWorkspace from "@/pages/reviewer/ReviewerWorkspace";
import ReviewTask from "@/pages/reviewer/ReviewTask";
import Dashboard from "@/pages/Dashboard";
import Notifications from "@/pages/Notifications";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/client" element={<ClientWorkspace />} />
          <Route path="/client/project/create" element={<CreateProject />} />
          <Route path="/client/project/:id" element={<ProjectDetail />} />
          <Route path="/client/complaints" element={<Complaints />} />
          <Route path="/manager" element={<ManagerCenter />} />
          <Route path="/manager/tasks" element={<TaskAssignment />} />
          <Route path="/manager/members" element={<MemberManagement />} />
          <Route path="/manager/reports" element={<Reports />} />
          <Route path="/annotator" element={<AnnotatorWorkspace />} />
          <Route path="/annotator/task/:id" element={<AnnotationTask />} />
          <Route path="/reviewer" element={<ReviewerWorkspace />} />
          <Route path="/reviewer/task/:id" element={<ReviewTask />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
