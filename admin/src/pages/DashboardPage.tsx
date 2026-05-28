import { Link } from "react-router-dom";

function DashboardPage() {
  return (
    <div className="container">
      <div className="card">
        <h1 className="heading">Admin Dashboard</h1>
        <p>Welcome to the admin app. Your login is working and the dashboard route is ready for the next admin features.</p>
        <div className="link-row">
          <Link to="/login">Back to login</Link>
          <Link to="/signup">Create another admin</Link>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
