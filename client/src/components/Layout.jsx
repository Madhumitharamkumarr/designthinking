import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <main className="page-wrapper">{children}</main>
      </div>
    </div>
  );
}
