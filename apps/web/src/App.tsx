import { Routes, Route } from 'react-router-dom';
import ChannelListScreen from './screens/ChannelListScreen';
import PlayerScreen from './screens/PlayerScreen';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChannelListScreen />} />
      <Route path="/play/:id" element={<PlayerScreen />} />
    </Routes>
  );
}

export default App;
