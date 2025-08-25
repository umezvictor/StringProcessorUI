import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import z from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import type { AppDispatch, RootState } from "../app/store";
import { useDispatch, useSelector } from "react-redux";
import { zodResolver } from "@hookform/resolvers/zod";
import { clearError, loginAsync } from "../features/userSlice";
import { toast, ToastContainer } from "react-toastify";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

type LoginRequest = z.infer<typeof schema>;

export default function LoginPage() {
  const { isLoggedIn, error } = useSelector(
    (state: RootState) => state.user.value
  );
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(schema),
  });

  const handleLogin: SubmitHandler<LoginRequest> = async (data) => {
    try {
      await dispatch(loginAsync(data));
    } catch (error) {
      setError("root", { type: "manual", message: String(error) });
    }
  };

  useEffect(() => {
    dispatch(clearError());
    if (isLoggedIn) {
      navigate("/process");
    }
    if (error) {
      toast.error(error);
    }
  }, [isLoggedIn, error]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <ToastContainer />
      <div className="card shadow p-5 mx-auto" style={{ maxWidth: "500px" }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Login</h2>
          <form onSubmit={handleSubmit(handleLogin)}>
            <div className="mb-4">
              <label htmlFor="email" className="form-label fs-6">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="Enter your email"
                className="form-control form-control-lg"
                id="email"
              />
              {errors.email && (
                <div className="text-danger mt-2">{errors.email.message}</div>
              )}
            </div>

            <div className="mb-4 position-relative">
              <label htmlFor="password" className="form-label fs-6">
                Password
              </label>
              <div className="input-group">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="form-control form-control-lg"
                  id="password"
                />
                <span
                  className="input-group-text bg-white border-0"
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z"
                        stroke="#888"
                        strokeWidth="2"
                      />
                      <path d="M7 13L13 7" stroke="#888" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z"
                        stroke="#888"
                        strokeWidth="2"
                      />
                      <circle
                        cx="10"
                        cy="10"
                        r="3"
                        stroke="#888"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </span>
              </div>
              {errors.password && (
                <div className="text-danger mt-2">
                  {errors.password.message}
                </div>
              )}
            </div>

            <div className="d-grid">
              <button type="submit" className="btn btn-success btn-md py-3">
                Login
              </button>
            </div>
            {errors.root && (
              <div className="text-danger mt-3">{errors.root.message}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
