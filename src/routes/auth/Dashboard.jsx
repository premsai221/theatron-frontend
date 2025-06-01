import { Container } from "react-bootstrap";
import { useSelector } from "react-redux";


function Dashboard() {
  
  const user = useSelector((state) => state.auth.user);
  
  return (
    <Container className="py-4">
      {user}
    </Container>
  );
}

export default Dashboard;