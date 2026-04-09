import { AdminLayout } from "@/components/admin/AdminLayout";
import "./tracking.css";

export default function AdminTrackingPage() {
  return (
    <AdminLayout title="Tracking">
      <div className="admin-tracking-container">
        <div className="admin-tracking-card">
          {/* TODO: Add tracking content — maps, order tracking, delivery status */}
          <div className="admin-tracking-placeholder">
            <p>Tracking information will be displayed here</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
