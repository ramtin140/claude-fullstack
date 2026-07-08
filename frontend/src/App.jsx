import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ToastStack from './components/ToastStack.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Tournaments from './pages/Tournaments.jsx';
import TournamentDetail from './pages/TournamentDetail.jsx';
import News from './pages/News.jsx';
import NewsDetail from './pages/NewsDetail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';
import H2HList from './pages/H2HList.jsx';
import H2HCreate from './pages/H2HCreate.jsx';
import H2HDetail from './pages/H2HDetail.jsx';
import Wallet from './pages/Wallet.jsx';
import PlayerSearch from './pages/PlayerSearch.jsx';
import Profile from './pages/Profile.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import MessagesInbox from './pages/MessagesInbox.jsx';
import MessageThread from './pages/MessageThread.jsx';
import SupportPage from './pages/SupportPage.jsx';
import SupportDetail from './pages/SupportDetail.jsx';
import GoalClips from './pages/GoalClips.jsx';
import MemberLayout from './components/MemberLayout.jsx';

import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminTournaments from './pages/admin/AdminTournaments.jsx';
import AdminMatches from './pages/admin/AdminMatches.jsx';
import AdminNews from './pages/admin/AdminNews.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminGameOptions from './pages/admin/AdminGameOptions.jsx';
import AdminExpertQueue from './pages/admin/AdminExpertQueue.jsx';
import AdminEconomy from './pages/admin/AdminEconomy.jsx';
import AdminSupport from './pages/admin/AdminSupport.jsx';
import AdminWithdrawals from './pages/admin/AdminWithdrawals.jsx';
import AdminGoalClips from './pages/admin/AdminGoalClips.jsx';
import AdminDeposits from './pages/admin/AdminDeposits.jsx';
import AdminPaymentMethods from './pages/admin/AdminPaymentMethods.jsx';
import AdminContactMessages from './pages/admin/AdminContactMessages.jsx';
import AdminRevenue from './pages/admin/AdminRevenue.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <ToastStack />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/u/:id" element={<PublicProfile />} />
        {/* Member shell renders its sidebar/mobile tabbar only when logged
            in, so /h2h and /support/:id stay reachable by guests too without
            losing the surrounding chrome for members who navigate there from
            their own dashboard. */}
        <Route element={<MemberLayout />}>
          <Route path="/h2h" element={<H2HList />} />
          <Route path="/h2h/:id" element={<H2HDetail />} />
          <Route
            path="/h2h/new"
            element={
              <ProtectedRoute>
                <H2HCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support/:id"
            element={
              <ProtectedRoute>
                <SupportDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/players"
            element={
              <ProtectedRoute>
                <PlayerSearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesInbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:userId"
            element={
              <ProtectedRoute>
                <MessageThread />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goal-clips"
            element={
              <ProtectedRoute>
                <GoalClips />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['writer', 'match_expert']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route
            path="tournaments"
            element={
              <ProtectedRoute roles={[]}>
                <AdminTournaments />
              </ProtectedRoute>
            }
          />
          <Route
            path="matches"
            element={
              <ProtectedRoute roles={[]}>
                <AdminMatches />
              </ProtectedRoute>
            }
          />
          <Route
            path="news"
            element={
              <ProtectedRoute roles={['writer']}>
                <AdminNews />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={[]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="game-options"
            element={
              <ProtectedRoute roles={[]}>
                <AdminGameOptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="expert-queue"
            element={
              <ProtectedRoute roles={['match_expert']}>
                <AdminExpertQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="economy"
            element={
              <ProtectedRoute roles={[]}>
                <AdminEconomy />
              </ProtectedRoute>
            }
          />
          <Route
            path="revenue"
            element={
              <ProtectedRoute roles={[]}>
                <AdminRevenue />
              </ProtectedRoute>
            }
          />
          <Route
            path="support"
            element={
              <ProtectedRoute roles={['writer']}>
                <AdminSupport />
              </ProtectedRoute>
            }
          />
          <Route
            path="withdrawals"
            element={
              <ProtectedRoute roles={[]}>
                <AdminWithdrawals />
              </ProtectedRoute>
            }
          />
          <Route
            path="goal-clips"
            element={
              <ProtectedRoute roles={[]}>
                <AdminGoalClips />
              </ProtectedRoute>
            }
          />
          <Route
            path="deposits"
            element={
              <ProtectedRoute roles={[]}>
                <AdminDeposits />
              </ProtectedRoute>
            }
          />
          <Route
            path="payment-methods"
            element={
              <ProtectedRoute roles={[]}>
                <AdminPaymentMethods />
              </ProtectedRoute>
            }
          />
          <Route
            path="contact-messages"
            element={
              <ProtectedRoute roles={['writer']}>
                <AdminContactMessages />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
