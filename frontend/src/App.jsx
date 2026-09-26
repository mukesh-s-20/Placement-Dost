import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { FocusModeProvider, useFocusMode } from './context/FocusModeContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { FocusModeOverlay } from './components/FocusModeOverlay.jsx';
import { PointsLedgerModal } from './components/PointsLedgerModal.jsx';
import { OnboardingPage } from './pages/OnboardingPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { LearningSpacePage } from './pages/LearningSpacePage.jsx';
import { DSAPracticePage } from './pages/DSAPracticePage.jsx';
import { PrepPlanPage } from './pages/PrepPlanPage.jsx';
import { PeerLearningPage } from './pages/PeerLearningPage.jsx';
import './App.css';

function MainApp() {
  const { user } = useAuth();
  const { isFocusActive } = useFocusMode();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // If user is not authenticated or hasn't completed onboarding baseline, show Onboarding
  if (!user || (!user.baselineCompleted && currentTab !== 'dashboard')) {
    return <OnboardingPage onComplete={() => setCurrentTab('dashboard')} />;
  }

  return (
    <div className="app-layout">
      {/* Focus Mode Overlay (guards tab switching & displays focus header) */}
      <FocusModeOverlay onReturnHome={() => setCurrentTab('dashboard')} />

      {/* Top Navigation Bar (Hidden during full Focus Mode if preferred, or visible with status) */}
      {!isFocusActive && (
        <Navbar
          currentTab={currentTab}
          onNavigate={(tab) => setCurrentTab(tab)}
          onOpenLedger={() => setShowLedgerModal(true)}
        />
      )}

      {/* Main Content Viewport */}
      <main className={`main-content ${isFocusActive ? 'focus-mode-active' : ''}`}>
        {currentTab === 'dashboard' && (
          <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />
        )}

        {currentTab === 'learn' && (
          <LearningSpacePage
            onExitToHome={() => setCurrentTab('dashboard')}
            onNavigateToPeer={() => setCurrentTab('peer')}
          />
        )}

        {currentTab === 'prep-plan' && (
          <PrepPlanPage onNavigateToLearn={() => setCurrentTab('learn')} />
        )}

        {currentTab === 'dsa' && (
          <DSAPracticePage />
        )}

        {currentTab === 'peer' && (
          <PeerLearningPage />
        )}

        {currentTab === 'onboarding' && (
          <OnboardingPage onComplete={() => setCurrentTab('dashboard')} />
        )}
      </main>

      {/* Points Ledger & Gamification Rules Modal */}
      <PointsLedgerModal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FocusModeProvider>
        <MainApp />
      </FocusModeProvider>
    </AuthProvider>
  );
}
