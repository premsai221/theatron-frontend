import { useSelector } from "react-redux";
import { Navigate } from "react-router";

function UnProtectedPage({children}) {
    const user = useSelector((state) => state.auth.user);
    return user != null ? <Navigate to="/dashboard" replace/> : children;
}

export default UnProtectedPage;