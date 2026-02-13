import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "./WelcomePage";
import Login from "./Login";
import Signup from "./Signup";
import ChatPage from "./ChatPage";
import ProfilePage from "./ProfilePage";
import HomePage from "./HomePage";
import TrackCyclePage from "./TrackCyclePage";
import EducationPage from "./EducationPage";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/track-cycle" element={<TrackCyclePage />} />
          <Route path="/education" element={<EducationPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
