import { createRoot } from "react-dom/client";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import ErrorPage from "./pages/ErrorPage";
import HomePage from "./pages/HomePage";
import { Provider } from "react-redux";
import { persistor, store } from "./app/store";
import ProtectedRoute from "./utils/ProtectedRoute";
import { PersistGate } from "redux-persist/integration/react";
import ProcessStringPage from "./pages/ProcessStringPage";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />} errorElement={<ErrorPage />}>
      <Route index element={<HomePage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="process" element={<ProtectedRoute />}>
        <Route index element={<ProcessStringPage />} />
      </Route>
    </Route>
  )
);

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <RouterProvider router={router} />
    </PersistGate>
  </Provider>
);
//provider ensures we can access the state via redux anywhere
