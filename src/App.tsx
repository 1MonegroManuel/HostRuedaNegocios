import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CompanyRegistrationProvider } from "./contexts/CompanyRegistrationContext";

// Auth pages
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import CompanyRegistration from "./pages/auth/Company-registration";
import EmployeeRegistration from "./pages/auth/Employee-registration";
import EncargadoRegistration from "./pages/auth/Encargado-registration";
import PersonalRegistration from "./pages/auth/Personal-registration";

// Common pages
import Home from "./pages/common/Home";
import Notifications from "./pages/common/Notifications";

// Admin pages
// import NotificationsAdmin from "./pages/admin/notificationsAdmin"; // Removed - now using unified Notifications

// Events pages
import RegisterEvent from "./pages/events/RegisterEvent";
import EventFinished from "./pages/events/EventFinished";
import EventFinishedPage from "./pages/events/EventFinishedPage";
import EventQuotes from "./pages/events/Event-quotes";
import PlaceMap from "./pages/events/Place-map";
import CurrentEvents from "./pages/events/CurrentEvents";
import EditEvent from "./pages/events/EditEvent";
import EventDetail from "./pages/events/EventDetail";
import SelectEvents from "./pages/events/SelectEvents";
import EventRegistrationReview from "./pages/events/EventRegistrationReview";

// Companies pages
import Participant from "./pages/companies/Participants";
import ParticipantsSelect from "./pages/companies/ParticipantsSelect";
import AddCompanions from "./pages/companies/AddCompanions";
import CompanyEmployees from "./pages/companies/CompanyEmployees";
import CompanyLogoUpload from "./pages/companies/Company-logo";
import CompanyReceiptUpload from "./pages/companies/Company-receipt";
import RegistrationReview from "./pages/companies/Registration-Review";

// Meetings pages
import Meeting from "./pages/meetings/Meetings";
import Schedule from "./pages/meetings/Schedule";
import MyInvitations from "./pages/meetings/My-Invitations";
import MyAgenda from "./pages/meetings/My-Agenda";
import Requests from "./pages/meetings/Requests";

// Profile pages
import Profile from "./pages/profile/Profile";
import EditProfile from "./pages/profile/Edit-profile";
function App() {
  return (
    <AuthProvider>
      <CompanyRegistrationProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/company-registration" element={<CompanyRegistration />} />
          <Route path="/employee-registration" element={<EmployeeRegistration />} />
          <Route path="/encargado-registration" element={<EncargadoRegistration />} />
          <Route path="/personal-registration" element={<PersonalRegistration />} />
      <Route path="/home" element={<Home />} />
      <Route path="/Participant/:id" element={<Participant />} />
      <Route path="/EventQuotes" element={<EventQuotes />} />
      <Route path="/Schedule/:id" element={<Schedule />} />
      <Route path="/PlaceMap/:id" element={<PlaceMap />} />
      <Route path="/Schedule" element={<Schedule />} />
      <Route path="/PlaceMap" element={<PlaceMap />} />
      <Route path="/Meeting" element={<Meeting />} />
      <Route path="/Meeting/Invitations" element={<MyInvitations />} />
      <Route path="/Meeting/MyAgenda" element={<MyAgenda />} />
      <Route path="/Meeting/Requests" element={<Requests />} />
      <Route path="/Profile" element={<Profile />} />
      <Route path="/EditProfile" element={<EditProfile />} />
      <Route path="/Notifications" element={<Notifications />} />
      <Route path="/RegisterEvent" element={<RegisterEvent />} />
      <Route path="/EventFinished" element={<EventFinished />} />
      <Route path="/notificationsadmin" element={<Notifications />} />
      <Route path="/ParticipantsSelect" element={<ParticipantsSelect />} />
      <Route path="/EventFinishedPage/:id?" element={<EventFinishedPage />} />
      <Route path="/AddCompanions" element={<AddCompanions />} />
      <Route path="/CompanyEmployees" element={<CompanyEmployees />} />
      <Route path="/company-logo" element={<CompanyLogoUpload />} />
      <Route path="/company-receipt" element={<CompanyReceiptUpload />} />
      <Route path="/Registration-review" element={<RegistrationReview />} />
      <Route path="/profileadmin" element={<Profile />} />
      <Route path="/current-events" element={<CurrentEvents />} />
      <Route path="/EditEvent/:id?" element={<EditEvent />} />
      <Route path="/EventDetail/:id?" element={<EventDetail />} />
      <Route path="/SelectEvents" element={<SelectEvents />} />
      <Route path="/event-registration-review" element={<EventRegistrationReview />} />
        </Routes>
      </CompanyRegistrationProvider>
    </AuthProvider>
  );
}

export default App;
