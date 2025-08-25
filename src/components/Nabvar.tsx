import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { APICore } from "../api/apiCore";

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
    window.location.reload();
  };

  var api = new APICore();
  return (
    <nav
      className="navbar navbar-expand-lg"
      style={{ backgroundColor: "#234F8C", color: "white" }}
    >
      <div className="container-fluid">
        <Link to="/" className="navbar-brand text-white">
          Stringify
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link to="/" className="nav-link text-white">
                Home
              </Link>
            </li>

            {!api.isUserAuthenticated() && (
              <li className="nav-item">
                <Link to="/login" className="nav-link text-white">
                  Login
                </Link>
              </li>
            )}

            {api.isUserAuthenticated() && (
              <>
                <li className="nav-item">
                  <Link to="/process" className="nav-link text-white">
                    Process string
                  </Link>
                </li>
                <li className="nav-item">
                  <a
                    href="#"
                    className="nav-link text-white"
                    onClick={handleLogout}
                  >
                    Logout
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
