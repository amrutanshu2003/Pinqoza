import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { sendContactMessage } from '../services/api';

const Contact = () => {
  const { isDarkMode } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setWarning('');
    setSubmitted(false);

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    if (name.length < 2) return setError('Please enter your name.');
    if (!email.includes('@')) return setError('Please enter a valid email.');
    if (message.length < 10) return setError('Please write a longer message.');

    setSending(true);
    sendContactMessage({ name, email, message })
      .then((res) => {
        setSubmitted(true);
        setForm({ name: '', email: '', message: '' });
        if (res?.data?.ackSent === false) {
          setWarning('Your request reached support, but confirmation email could not be sent to user inbox.');
        }
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || 'Failed to send message. Try again.';
        setError(msg);
      })
      .finally(() => setSending(false));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="p-8 md:p-10">
          <h1 className={`text-3xl md:text-4xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Contact Pinqoza</h1>
          <p className={`mt-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Need help with orders, payments, or anything else? Send us a message.
          </p>

          <div className="mt-8 grid gap-4">
            <div className={`rounded-2xl p-4 border ${isDarkMode ? 'border-gray-800 bg-black/40' : 'border-gray-200 bg-gray-50'}`}>
              <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email</div>
              <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>pinqoza.support@gmail.com</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className={`w-full px-4 py-3 rounded-2xl border outline-none ${
                  isDarkMode
                    ? 'bg-black/40 border-gray-800 text-white placeholder-gray-500 focus:border-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400'
                }`}
              />
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email address"
                className={`w-full px-4 py-3 rounded-2xl border outline-none ${
                  isDarkMode
                    ? 'bg-black/40 border-gray-800 text-white placeholder-gray-500 focus:border-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400'
                }`}
              />
            </div>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              placeholder="How can we help?"
              className={`w-full px-4 py-3 rounded-2xl border outline-none resize-none ${
                isDarkMode
                  ? 'bg-black/40 border-gray-800 text-white placeholder-gray-500 focus:border-gray-600'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400'
              }`}
            />

            <button
              type="submit"
              disabled={sending}
              className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg hover:opacity-95 transition disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Send Message'}
            </button>

            {error ? (
              <div className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</div>
            ) : null}

            {submitted && (
              <div className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                Message sent successfully. We will get back to you soon.
              </div>
            )}
            {warning ? (
              <div className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>{warning}</div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
