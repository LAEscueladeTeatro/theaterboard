import './App.css'
import StudentList from '@/components/StudentList.jsx';

function App() {
  return (
    <>
      <header>
        <h1>TheaterBoard</h1>
      </header>
      <main>
        <StudentList />
      </main>
      <footer>
        <p>&copy; 2024 TheaterBoard</p>
      </footer>
    </>
  )
}

export default App
