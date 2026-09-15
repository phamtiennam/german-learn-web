import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import TranslateScreen from '../features/translate/TranslateScreen'
import VocabularyScreen from '../features/vocabulary/VocabularyScreen'
import AddRoute from '../features/vocabulary/AddRoute'
import ReviewScreen from '../features/review/ReviewScreen'
import VoiceScreen from '../features/voice/VoiceScreen'
import SettingsScreen from '../features/settings/SettingsScreen'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/translate" replace />} />
        <Route path="/translate" element={<TranslateScreen />} />
        <Route path="/vocabulary" element={<VocabularyScreen />} />
        <Route path="/add" element={<AddRoute />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/voice" element={<VoiceScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/translate" replace />} />
      </Route>
    </Routes>
  )
}
