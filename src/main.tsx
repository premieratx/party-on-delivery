// NO IMPORTS - testing if the error happens before any code runs
console.log('Main.tsx is executing');

document.getElementById("root")!.innerHTML = `
  <div style="padding: 20px;">
    <h1>Static Test</h1>
    <p>If you see this, the error is NOT in our code</p>
    <script>console.log('Inline script executed');</script>
  </div>
`;