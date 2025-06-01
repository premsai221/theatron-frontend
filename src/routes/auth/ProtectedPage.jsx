import { useSelector } from "react-redux";
import { Navigate } from "react-router";

function ProtectedPage({children}) {
    const user = useSelector((state) => state.auth.user);
    return user == null? <Navigate to="/" replace/> : children;
}

export default ProtectedPage;