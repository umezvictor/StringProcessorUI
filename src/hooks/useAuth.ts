// custom hook
import { useDispatch } from "react-redux";

import { clearUser } from "../features/userSlice";
import { APICore } from "../api/apiCore";

const useAuth = () => {
  var api = new APICore();
  const dispatch = useDispatch();

  const logout = () => {
    api.setLoggedInUser(null);
    dispatch(clearUser());
  };

  return { logout };
};

export default useAuth;
