import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play, X, Type, Contrast, Link as LinkIcon, BookOpen } from 'lucide-react';

const AccessibilityButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Israeli accessibility features
  const [fontSize, setFontSize] = useState('normal'); // normal, large, xlarge
  const [highContrast, setHighContrast] = useState(false);
  const [highlightLinks, setHighlightLinks] = useState(false);
  const [readableFont, setReadableFont] = useState(false);

  useEffect(() => {
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
      setSpeechSupported(true);

      // Load voices - this is critical for avoiding "interrupted" error
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
          console.log('Voices loaded:', voices.length);
        }
      };

      // Try to load voices immediately
      loadVoices();

      // Also listen for voiceschanged event (Chrome needs this)
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      // Fallback: try again after a delay
      setTimeout(loadVoices, 100);
    }

    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Apply font size changes
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'large') {
      root.style.fontSize = '120%';
    } else if (fontSize === 'xlarge') {
      root.style.fontSize = '140%';
    } else {
      root.style.fontSize = '100%';
    }
  }, [fontSize]);

  // Apply high contrast mode
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
      document.body.style.filter = 'contrast(1.5) brightness(0.9)';
    } else {
      document.body.classList.remove('high-contrast');
      document.body.style.filter = '';
    }
  }, [highContrast]);

  // Apply link highlighting
  useEffect(() => {
    if (highlightLinks) {
      const style = document.createElement('style');
      style.id = 'link-highlight-style';
      style.innerHTML = `
        a, button {
          outline: 2px solid #FFD700 !important;
          outline-offset: 2px !important;
          background-color: rgba(255, 255, 0, 0.1) !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      const style = document.getElementById('link-highlight-style');
      if (style) style.remove();
    }
    return () => {
      const style = document.getElementById('link-highlight-style');
      if (style) style.remove();
    };
  }, [highlightLinks]);

  // Apply readable font
  useEffect(() => {
    if (readableFont) {
      document.body.style.fontFamily = 'Arial, Helvetica, sans-serif';
    } else {
      document.body.style.fontFamily = '';
    }
  }, [readableFont]);

  const getPageText = () => {
    // Try to get main content area
    let contentElement = document.querySelector('main') ||
                         document.querySelector('[role="main"]') ||
                         document.querySelector('.container') ||
                         document.body;

    // Create a clone to avoid modifying the actual DOM
    const clone = contentElement.cloneNode(true);

    // Remove elements we don't want to read
    const elementsToRemove = clone.querySelectorAll(
      'script, style, nav, header .navbar, button, input, select, textarea, [aria-hidden="true"]'
    );
    elementsToRemove.forEach(el => el.remove());

    // Get text content
    let text = clone.textContent || clone.innerText || '';

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    console.log('Extracted text length:', text.length);
    console.log('First 100 characters:', text.substring(0, 100));

    return text;
  };

  const startSpeaking = () => {
    console.log('startSpeaking called');
    console.log('speechSupported:', speechSupported);
    console.log('voicesLoaded:', voicesLoaded);

    if (!speechSupported) {
      alert('Text-to-speech is not supported in your browser');
      return;
    }

    const text = getPageText();

    if (!text || text.length < 10) {
      alert('No text content found on this page. Text length: ' + text.length);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Longer delay to ensure cancel completes and voices are loaded
    setTimeout(() => {
      console.log('Creating utterance with text length:', text.length);

      const utterance = new SpeechSynthesisUtterance(text);

      // Get available voices and select one
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);

      if (voices.length > 0) {
        // Try to find an English voice, prefer Microsoft or Google voices
        const englishVoice = voices.find(voice =>
          voice.lang.startsWith('en') &&
          (voice.name.includes('Microsoft') || voice.name.includes('Google'))
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];

        utterance.voice = englishVoice;
        console.log('Using voice:', englishVoice.name, englishVoice.lang);
      }

      // Configure speech settings
      utterance.rate = 1.0; // Speed of speech (0.1 to 10)
      utterance.pitch = 1.0; // Pitch (0 to 2)
      utterance.volume = 1.0; // Volume (0 to 1)
      utterance.lang = 'en-US'; // Set language

      // Event handlers
      utterance.onstart = () => {
        console.log('Speech started');
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        console.log('Speech ended');
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        alert('Speech error: ' + event.error + '\n\nTry:\n1. Refresh the page\n2. Check browser permissions\n3. Try a different browser');
        setIsSpeaking(false);
        setIsPaused(false);
      };

      console.log('Calling speechSynthesis.speak()');

      // Set speaking state immediately for UI feedback
      setIsSpeaking(true);

      window.speechSynthesis.speak(utterance);

      // Verify it's speaking
      setTimeout(() => {
        const isActuallySpeaking = window.speechSynthesis.speaking;
        const isPending = window.speechSynthesis.pending;

        console.log('Speaking status:', isActuallySpeaking);
        console.log('Paused status:', window.speechSynthesis.paused);
        console.log('Pending status:', isPending);

        // If not speaking after 1 second, reset state
        if (!isActuallySpeaking && !isPending) {
          console.warn('Speech did not start properly, resetting state');
          setIsSpeaking(false);
        }
      }, 1000);
    }, 250);
  };

  const pauseSpeaking = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return (
    <>
      {/* Main accessibility button - fixed in bottom-right corner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-200 z-50 focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label="Accessibility options"
        title="Accessibility options"
      >
        <Volume2 size={24} />
      </button>

      {/* Accessibility menu panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 bg-white rounded-lg shadow-xl p-6 z-50 w-80 border border-gray-200 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Accessibility</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Text-to-Speech section */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 size={20} className="text-blue-600" />
              <h4 className="font-semibold text-gray-700">Text-to-Speech</h4>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Listen to the page content being read aloud
            </p>

            {!speechSupported && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  Text-to-speech is not supported in your browser
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2">
              {!isSpeaking ? (
                <button
                  onClick={startSpeaking}
                  disabled={!speechSupported}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  Start Reading
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={resumeSpeaking}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play size={16} />
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={pauseSpeaking}
                      className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Pause size={16} />
                      Pause
                    </button>
                  )}
                  <button
                    onClick={stopSpeaking}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <VolumeX size={16} />
                    Stop
                  </button>
                </>
              )}
            </div>

            {/* Status indicator */}
            {isSpeaking && (
              <div className="mt-3 flex items-center gap-2">
                <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {isPaused ? 'Paused' : 'Reading page content...'}
                </span>
              </div>
            )}
          </div>

          {/* Font Size Control */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Type size={20} className="text-blue-600" />
              <h4 className="font-semibold text-gray-700">Font Size</h4>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFontSize('normal')}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                  fontSize === 'normal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors text-lg ${
                  fontSize === 'large'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors text-xl ${
                  fontSize === 'xlarge'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                A
              </button>
            </div>
          </div>

          {/* High Contrast */}
          <div className="border-t pt-4 mt-4">
            <button
              onClick={() => setHighContrast(!highContrast)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Contrast size={20} className="text-blue-600" />
                <span className="font-semibold text-gray-700">High Contrast</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${
                highContrast ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                  highContrast ? 'ml-6' : 'ml-0.5'
                }`}></div>
              </div>
            </button>
          </div>

          {/* Highlight Links */}
          <div className="border-t pt-4 mt-4">
            <button
              onClick={() => setHighlightLinks(!highlightLinks)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <LinkIcon size={20} className="text-blue-600" />
                <span className="font-semibold text-gray-700">Highlight Links</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${
                highlightLinks ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                  highlightLinks ? 'ml-6' : 'ml-0.5'
                }`}></div>
              </div>
            </button>
          </div>

          {/* Readable Font */}
          <div className="border-t pt-4 mt-4">
            <button
              onClick={() => setReadableFont(!readableFont)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-blue-600" />
                <span className="font-semibold text-gray-700">Readable Font</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${
                readableFont ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                  readableFont ? 'ml-6' : 'ml-0.5'
                }`}></div>
              </div>
            </button>
          </div>

          {/* Reset All */}
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => {
                setFontSize('normal');
                setHighContrast(false);
                setHighlightLinks(false);
                setReadableFont(false);
                stopSpeaking();
              }}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40"
          aria-hidden="true"
        ></div>
      )}
    </>
  );
};

export default AccessibilityButton;
