//I wrapped this around my protected routes in main.tsx
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import type { RootState } from "../app/store";

const ProtectedRoute = () => {
  const user = useSelector((state: RootState) => state.user.value.user);
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
