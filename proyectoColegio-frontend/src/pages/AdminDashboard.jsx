import DashboardLayout from "../layouts/DashboardLayout";
import { AcademicCycleProvider } from "../hooks/useAcademicCycles";

const AdminDashboard = () => (
  <AcademicCycleProvider>
    <DashboardLayout />
  </AcademicCycleProvider>
);

export default AdminDashboard;
