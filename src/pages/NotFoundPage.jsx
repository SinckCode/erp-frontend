import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div>
      <h2>404 - No encontrado</h2>
      <Link to="/dashboard">Ir al dashboard</Link>
    </div>
  );
}
