/*React Starter Lab – Student Info Card

  In this lab, you will create a simple React project using Vite. The goal is to understand how to:
- Create React components.
- Learn about the JSX syntax.
- Use props to pass data into components.
- Render components inside the App.jsx file.

------------------------------------------------------------
Setup
------------------------------------------------------------
1. Open VS Code and go to the terminal.
2. Move into the project folder by running: cd 5-2-react-starter
3. Install the required node modules by running: npm install or npm i
4. To see the output, start the development server by running: npm run dev

Note: In order to gain good marks in the lab, please follow the lab instructions strickly.

3. Inside the project folder, go to src to find the components:

   src/components

------------------------------------------------------------
Task 1 – Create a StudentCard Component
------------------------------------------------------------
Scenario: The school needs a card to display a student’s details.

1. Inside the components folder, create a file called:
   StudentCard.jsx

2. Inside Student_Card_Static.jsx, create a React functional component named StudentCardSatic.

3. The component should return a div that shows:
   - Student’s name (use <h3> tag)
   - Student’s id (use <p> tag)
   - Student’s department (use <p> tag)
   (For now, hardcode these values, e.g., Name: YOUR_NAME, ID: YOUR_STUDENT_ID, Department: YOUR_DEPARTMENT_NAME)

Hints:
- Use the function component syntax:
  function StudentCardStatic() {
    return (
      <div>
       
      </div>
    );
  }

  export default StudentCard;

- To render this component inside your app, import it into App.jsx:
  import StudentCard from './components/StudentCard';

  function App() {
    return (
      <div>
        <h1>Student Info</h1>
        <StudentCardStatic />
      </div>
    );
  }

  export default App;

Expected Output:
A simple card showing a student’s information.

------------------------------------------------------------
Task 2 – Make Student Cards Dynamic using Props and map()
------------------------------------------------------------
Scenario: The school wants to display student cards dynamically from a list.

1. In StudentCardDynamic.jsx:
   - Accept props for student information (name, id, dept).
   - Display these values inside the component using JSX.

   Hint:
   function ComponentName(props) {
  return (
    <div>
      <h3>Label: {props.someProperty}</h3>
      <p>Label: {props.anotherProperty}</p>
      <p>Label: {props.thirdProperty}</p>
    </div>
  );
}

2. In App.jsx:
   - Create an array of student objects:

   const students = [
     { id: 1, name: "Hasan", department: "ICS" },
     { id: 2, name: "Turki", department: "SWE" }
   ];

3. Render the student cards dynamically:
   - Use map() to loop through the students array.
   - For each student, render a StudentCardDynamic component.
   - Pass student data as props.
   - Use a unique key for each rendered component.

   Hint:
   students.map(item => (
     <Component
       prop1={item.value}
       prop2={item.value}
       prop3={item.value}
     />
   ))

Notes:
- students → array of multiple objects
- map() → loops through the array
- Each student object is passed as props
- StudentCardDynamic displays the props

Expected Output:
The page should display a student card for each student in the list.
*/

import './App.css'

function App() {
  return (
    <div className="app">
      <header className="dashboard-header">
        <h1>Student Information Dashboard</h1>
        <p>View and manage student details</p>
      </header>

      <main className="dashboard-main">
        <div className="cards-container">
          {/* TODO: Import and render StudentCard components here */}
        </div>
      </main>
    </div>
  )
}

export default App
