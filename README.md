# React Starter Lab – Student Info Card

## Introduction to React
React is a **JavaScript library** developed by **Facebook (Meta)** in 2013. It was created to simplify building user interfaces for web applications. Before React, front-end developers relied heavily on **HTML, CSS, and vanilla JavaScript** (or jQuery) for dynamic web pages, which often became complex and hard to maintain.

React introduced the concept of **components** – small, reusable pieces of UI – making web development more structured and efficient.

---

## How React is Different from Standard Front-End Techniques
- **Traditional approach:** Developers wrote static HTML and then used **JavaScript/jQuery** to directly manipulate the DOM (Document Object Model) when something changed.
- **React approach:** Developers build UIs using **components** and **JSX**, and React updates the UI automatically when data changes.  

This means you focus on **state and logic**, while React handles efficient UI updates.

---

## Main Benefits of React
- **Reusable Components** → Build once, use multiple times.  
- **Virtual DOM** → Faster updates compared to direct DOM manipulation.  
- **Strong Ecosystem** → Backed by Meta, widely adopted, and has a rich ecosystem.  
- **Single Page Applications (SPA)** → React helps build SPAs easily, where the page doesn’t reload, but content updates dynamically.  

---

## DOM Manipulation in React vs HTML
- **HTML/JS:** You manually select elements (`document.getElementById`) and update their content (`innerHTML`).  
- **React:** Uses a **Virtual DOM**. Instead of updating the real DOM directly, React compares changes (diffing) and updates only what’s necessary.  

Result: Better **performance** and **developer productivity**.

---

## JSX Syntax
JSX is a special syntax that lets you write **HTML-like code inside JavaScript**.  
Example:
```jsx
function Welcome() {
  return <h1>Hello, React!</h1>;
}
```
- JSX makes code more readable and closer to how the UI should look.  
- Under the hood, JSX is compiled into standard JavaScript.  

---

## Structure of a React Project
When you create a React project (using Vite or Create React App), the structure looks like this:

```
react-starter/
├── node_modules/        # Dependencies
├── public/              # Static files
├── src/                 # Your code lives here
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point that renders App
│   └── components/      # Custom reusable components
├── package.json         # Project configuration
└── vite.config.js       # Vite configuration
```

**How it works:**  
- `main.jsx` renders `<App />` into the browser’s root `<div>` (found in `index.html`).  
- `App.jsx` can render other components.  
- Components inside `src/components/` are imported and used in `App.jsx`.  

---

## Reading Assignment
1. [5.5 Getting started with React](https://learn.zybooks.com/zybook/SWE363Fall2025/chapter/5/section/5)  
2. [5.6 JSX](https://learn.zybooks.com/zybook/SWE363Fall2025/chapter/5/section/6)  
3. [5.7 Components](https://learn.zybooks.com/zybook/SWE363Fall2025/chapter/5/section/7)  

---

## 📂 Lab Instructions
You can find the detailed step-by-step instructions for this lab in the **instructions.txt** file.

## Creating a Vite + React Project
Run the following commands in VS Code terminal:

```bash
# Create a new Vite project
npm create vite@latest react-starter

# Navigate into the folder
cd react-starter

# Install dependencies
npm install

# Run the development server
npm run dev
```

During project setup:  
- **Framework:** React  
- **Variant:** JavaScript (choose TypeScript only if you are comfortable with TS)

---

##  Concepts Used in the Tasks
- **Components** → Small, reusable building blocks (`StudentCard`).  
- **Props** → Used to pass data from parent (`App.jsx`) to child components (`StudentCard`).  
- **Rendering** → Import and use components inside `App.jsx`.  

### 🔹 Component
A **component** in React is a small, reusable piece of UI.  
It can be a function or a class that returns HTML-like code (JSX).

### Code Syntax:

**Creating a component:**
```jsx
function MyComponent() {
  return <h2>This is a component</h2>;
}
export default MyComponent;
```

###  Props
Props (properties) are used to pass data from a parent component to a child component.
They make components dynamic and reusable.

### Code Syntax:

**Using props in a component:**
```jsx
function MyComponent(props) {
  return <p>Hello, {props.name}</p>;
}
```
###  Rendering
Rendering means showing the component on the web page.
In React, rendering happens when a component is inserted into the root element of the HTML file.

**Rendering in App.jsx:**
```jsx
import MyComponent from './components/MyComponent';

function App() {
  return <MyComponent name="Alice" />;
}
```

---

## ✅ Lab Submission Checklist
Before submitting your lab, make sure you have:  

- [ ] Created a `StudentCard` component in `src/components/`.  
- [ ] Displayed **Name, ID, Department** inside the card.  
- [ ] Used correct HTML tags: `<h3>` for Name, `<p>` for ID & Department.  
- [ ] Modified the component to accept **props**.  
- [ ] Rendered **two different StudentCard components** inside `App.jsx`.  
- [ ] Project runs successfully with `npm run dev`.  
- [ ] No errors in the browser console.  

---

🎉 Congratulations! You’ve built your first React app using components and props.
