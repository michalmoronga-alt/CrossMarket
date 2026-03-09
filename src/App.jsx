import { useState } from 'react';
import { useAuth } from './hooks/useAuth.jsx';
import LoginScreen from './screens/LoginScreen';
import MarketScreen from './screens/MarketScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import UploadScreen from './screens/UploadScreen';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import SignalScreen from './screens/SignalScreen';

export default function App() {
  const { currentUser, userProfile, loading, logout } = useAuth(); // Added logout here
  const [screen, setScreen] = useState('market');
  const [selectedItem, setSelectedItem] = useState(null); // Renamed from selectedItemId

  function goToItem(itemId) {
    setSelectedItem(itemId);
    setScreen('item-detail');
    window.scrollTo(0, 0);
  }

  function goBack() {
    setSelectedItem(null);
    setScreen('market');
    window.scrollTo(0, 0);
  }

  function handleNavigate(newScreen) {
    setScreen(newScreen);
    window.scrollTo(0, 0);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cx-bg flex items-center justify-center">
        <span className="inline-block w-8 h-8 border-3 border-cx-orange/30 border-t-cx-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (userProfile?.active === false) {
    return (
      <div className="min-h-screen bg-cx-bg flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-cx-red mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Prístup odmietnutý</h2>
        <p className="text-cx-muted mb-6">Tvoj účet bol deaktivovaný.<br />Kontaktuj admina.</p>
        <button
          onClick={logout}
          className="px-6 py-2 bg-cx-surface border border-cx-border text-cx-text font-bold rounded hover:border-cx-orange transition-colors"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          Odhlásiť sa
        </button>
      </div>
    );
  }

  // Determine content
  let currentScreenContent = null;
  if (screen === 'item-detail') {
    currentScreenContent = <ItemDetailScreen itemId={selectedItem} onBack={goBack} />;
  } else if (screen === 'upload') {
    currentScreenContent = <UploadScreen onBack={goBack} />;
  } else if (screen === 'settings') {
    currentScreenContent = <SettingsScreen onBack={goBack} />;
  } else if (screen === 'profile') {
    currentScreenContent = <ProfileScreen onBack={goBack} />;
  } else if (screen === 'signal') {
    currentScreenContent = <SignalScreen onItemClick={goToItem} />;
  } else {
    currentScreenContent = (
      <>
        <MarketScreen onItemClick={goToItem} onProfileClick={() => handleNavigate('profile')} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-cx-bg w-full relative">
      <Sidebar screen={screen} onNavigate={handleNavigate} userProfile={userProfile} />

      <div className="flex-1 flex flex-col w-full min-w-0 pb-[60px] md:pb-0">
        {currentScreenContent}
      </div>

      <BottomNav screen={screen} onNavigate={handleNavigate} userProfile={userProfile} />
    </div>
  );
}
