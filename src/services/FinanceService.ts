export const FinanceService = {
  triggerJarvisVoiceConfirmation: (message: string) => {
    try {
      if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance();
        msg.text = message;
        // msg.voiceURI = 'Google UK English Male';
        msg.lang = 'en-US';
        msg.rate = 1.1;
        msg.pitch = 0.8; // Deeper voice
        msg.volume = 1;

        window.speechSynthesis.speak(msg);
      }
    } catch (e) {
      console.warn("Speech synthesis failed", e);
    }
  }
};
