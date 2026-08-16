import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import ClubHomePage from './pages/ClubHomePage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MemberDashboard from './pages/MemberDashboard.jsx'
import RoleSelectionPage from './pages/RoleSelectionPage.jsx'
import AgendaPage from './pages/AgendaPage.jsx'
import VotingPollPage from './pages/VotingPollPage.jsx'
import AttendancePage from './pages/AttendancePage.jsx'
import MOMPage from './pages/MOMPage.jsx'
import MinutesPage from './pages/MinutesPage.jsx'
import AttendanceLogPage from './pages/AttendanceLogPage.jsx'
import PhotoMemoriesPage from './pages/PhotoMemoriesPage.jsx'
import PastExcomPage from './pages/PastExcomPage.jsx'
import ExcomPage from './pages/ExcomPage.jsx'
import MentorPage from './pages/MentorPage.jsx'
import MemberProfilePage from './pages/MemberProfilePage.jsx'
import FeedbackPage from './pages/FeedbackPage.jsx'
import FeedbackInboxPage from './pages/FeedbackInboxPage.jsx'
import ExComDashboard from './pages/ExComDashboard.jsx'
import RoleManagementPage from './pages/RoleManagementPage.jsx'
import AgendaEditorPage from './pages/AgendaEditorPage.jsx'
import PollEditorPage from './pages/PollEditorPage.jsx'
import NewMemberApprovalsPage from './pages/NewMemberApprovalsPage.jsx'
import RenewalManagementPage from './pages/RenewalManagementPage.jsx'
import PhotoUploadPage from './pages/PhotoUploadPage.jsx'
import RegisterClubPage from './pages/RegisterClubPage.jsx'
import RegisterPresidentPage from './pages/RegisterPresidentPage.jsx'
import RegisterExcomPage from './pages/RegisterExcomPage.jsx'
import FounderLoginPage from './pages/FounderLoginPage.jsx'
import ClubReviewPage from './pages/ClubReviewPage.jsx'
import RequireApprovedAccount from './components/RequireApprovedAccount.jsx'
import RequireExcomRole from './components/RequireExcomRole.jsx'
import ComingSoon from './pages/ComingSoon.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/club/:clubId" element={<ClubHomePage />} />
      <Route path="/register-club" element={<RegisterClubPage />} />
      <Route path="/register-president" element={<RegisterPresidentPage />} />
      <Route
        path="/register-excom"
        element={
          <RequireExcomRole role="President">
            <RegisterExcomPage />
          </RequireExcomRole>
        }
      />
      <Route path="/founder-login" element={<FounderLoginPage />} />
      <Route path="/club-review" element={<ClubReviewPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireApprovedAccount>
            <MemberDashboard />
          </RequireApprovedAccount>
        }
      />
      <Route
        path="/roles"
        element={
          <RequireApprovedAccount>
            <RoleSelectionPage />
          </RequireApprovedAccount>
        }
      />
      <Route
        path="/agenda"
        element={
          <RequireApprovedAccount>
            <AgendaPage />
          </RequireApprovedAccount>
        }
      />
      <Route
        path="/poll"
        element={
          <RequireApprovedAccount>
            <VotingPollPage />
          </RequireApprovedAccount>
        }
      />
      <Route
        path="/attendance"
        element={
          <RequireExcomRole role="Secretary">
            <AttendancePage />
          </RequireExcomRole>
        }
      />
      <Route
        path="/mom"
        element={
          <RequireExcomRole role="Secretary">
            <MOMPage />
          </RequireExcomRole>
        }
      />
      <Route
        path="/minutes"
        element={
          <RequireApprovedAccount>
            <MinutesPage />
          </RequireApprovedAccount>
        }
      />
      <Route
        path="/attendance-log"
        element={
          <RequireApprovedAccount>
            <AttendanceLogPage />
          </RequireApprovedAccount>
        }
      />
      <Route
        path="/photos"
        element={
          <RequireApprovedAccount>
            <PhotoMemoriesPage />
          </RequireApprovedAccount>
        }
      />
      {/* Public — reachable from the club page's navbar without signing
          in, same as the club page itself. */}
      <Route path="/mentors" element={<MentorPage />} />
      <Route path="/past-excom" element={<PastExcomPage />} />
      <Route path="/excom" element={<ExcomPage />} />
      <Route
        path="/profile"
        element={
          <RequireApprovedAccount>
            <MemberProfilePage />
          </RequireApprovedAccount>
        }
      />
      <Route
        path="/feedback"
        element={
          <RequireApprovedAccount>
            <FeedbackPage />
          </RequireApprovedAccount>
        }
      />
      <Route
        path="/feedback-inbox"
        element={
          <RequireExcomRole role="President">
            <FeedbackInboxPage />
          </RequireExcomRole>
        }
      />
      <Route
        path="/excom-dashboard"
        element={
          <RequireApprovedAccount>
            <ExComDashboard />
          </RequireApprovedAccount>
        }
      />
      <Route
        path="/role-management"
        element={
          <RequireExcomRole role="VPE">
            <RoleManagementPage />
          </RequireExcomRole>
        }
      />
      <Route
        path="/agenda-editor"
        element={
          <RequireExcomRole role="VPE">
            <AgendaEditorPage />
          </RequireExcomRole>
        }
      />
      <Route
        path="/poll-editor"
        element={
          <RequireExcomRole role="SAA">
            <PollEditorPage />
          </RequireExcomRole>
        }
      />
      <Route
        path="/approvals"
        element={
          <RequireExcomRole role="VPM">
            <NewMemberApprovalsPage />
          </RequireExcomRole>
        }
      />
      <Route
        path="/renewals"
        element={
          <RequireExcomRole role="Treasurer">
            <RenewalManagementPage />
          </RequireExcomRole>
        }
      />
      <Route
        path="/photo-upload"
        element={
          <RequireExcomRole role="VPPR">
            <PhotoUploadPage />
          </RequireExcomRole>
        }
      />
      <Route path="*" element={<ComingSoon label="Page" />} />
    </Routes>
  )
}

export default App
