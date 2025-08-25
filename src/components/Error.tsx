import { Link } from "react-router-dom";

export default function Error() {
  return (
    <div className="container text-center my-5">
      <h1 className="display-6 text-danger">Page Not Found</h1>

      <p className="fs-5 text-secondary my-3">
        Oops! The page you're looking for was not found
      </p>

      <Link to="/" className="btn btn-success">
        Go Back to Home
      </Link>
    </div>
  );
}
