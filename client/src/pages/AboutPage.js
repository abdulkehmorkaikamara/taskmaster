import React from 'react';

export default function AboutPage() {
  const version = process.env.REACT_APP_VERSION || '1.0.0';
  return (
    <div className="settings-subpage">
      <h2>About TaskMaster</h2>
      <p>Version {version}</p>
      <p>
        TaskMaster is a powerful in-browser to-do & productivity suite,
        built with React and Node.js.  
      </p>
      <p>
        &copy; {new Date().getFullYear()} Brainwill Inc.  
        <a href="https://github.com/your-repo" target="_blank" rel="noreferrer">
          View on GitHub
        </a>
      </p>
      <p>
        Licensed under the MIT License.
      </p>
    </div>
  );
}
