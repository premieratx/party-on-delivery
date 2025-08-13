// Test 1: Add CSS import
import './index.css'

console.log('Main.tsx with CSS import executing');

document.getElementById("root")!.innerHTML = `
  <div style="padding: 20px;">
    <h1>CSS Import Test</h1>
    <p>Testing if CSS import causes the require error</p>
  </div>
`;