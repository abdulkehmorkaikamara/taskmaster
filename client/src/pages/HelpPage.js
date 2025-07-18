import React, { useState } from 'react';

export default function HelpPage() {
  const [message, setMessage] = useState('');

  const submitFeedback = async () => {
    await fetch(`${process.env.REACT_APP_SERVERURL}/feedback`, {
      method:  'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ message })
    });
    alert('Thanks for your feedback!');
    setMessage('');
  };

  return (
    <div className="settings-subpage">
      <h2>Help & Feedback</h2>
      <section>
        <h3>FAQ</h3>
        <p><strong>Q:</strong> How do I create recurring tasks?<br/>
        <strong>A:</strong> In the Create/Edit dialog, choose “Repeat” and pick a cadence.</p>
        {/* …more FAQs… */}
      </section>

      <section>
        <h3>Send us a message</h3>
        <textarea
          rows="5"
          placeholder="What can we help you with?"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button className="btn save" onClick={submitFeedback}>
          Send Feedback
        </button>
      </section>
    </div>
  );
}
