import { Link } from "react-router-dom";

export default function MainArea() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center">
        <h1
          style={{
            fontWeight: "bold",
            color: "#234F8C",
          }}
        >
          Generate random strings
        </h1>

        <Link to="/process" className="btn btn-success btn-lg">
          Get Started
        </Link>
      </div>
    </div>
  );
}
