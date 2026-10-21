import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

export function FloatingWhatsApp() {
  const reduceMotion = useReducedMotion();
  const phone = '5571992106043';
  const message = encodeURIComponent('Olá! Vim pelo site Studio Modesto e gostaria de agendar um horário.');
  const link = `https://wa.me/${phone}?text=${message}`;

  const [visible, setVisible] = useState(false);
  const [isDarkSection, setIsDarkSection] = useState(false); // Default: starts false (light section)

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > 100);
      const section = document.getElementById('pt-difference');
      const rect = section?.getBoundingClientRect();
      const button = document.querySelector('.studio-whatsapp')?.getBoundingClientRect();
      const position = button ? button.top + button.height / 2 : window.innerHeight - 64;
      setIsDarkSection(Boolean(rect && rect.top <= position && rect.bottom >= position));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          initial={{ opacity: 0, transform: reduceMotion ? 'none' : 'translateY(12px)' }}
          animate={{ opacity: 1, transform: 'translateY(0)' }}
          exit={{ opacity: 0, transform: reduceMotion ? 'none' : 'translateY(12px)' }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Agendar via WhatsApp"
          className={`studio-whatsapp${isDarkSection ? ' is-on-dark' : ''}`}
        >
          <svg
            viewBox="0 0 32 32"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M16 3C9.4 3 4 8 4 14.5c0 2.7 1 5.2 2.7 7.2L6 29l7.6-2.5c.7.2 1.6.3 2.4.3 6.6 0 12-5 12-11.5S22.6 3 16 3z" fillOpacity="0.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.7 10.7c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.7.1-1 .4-.4.4-1.3 1.3-1.3 3.2s1.3 3.7 1.5 4c.2.3 2.5 4 6.2 5.4 3 1.2 3.6 1 4.3.9.7-.1 2.2-.9 2.5-1.7.3-.8.3-1.5.2-1.7-.1-.2-.3-.3-.6-.5l-2.1-1c-.3-.1-.6-.2-.8.2-.2.4-.9 1.1-1.1 1.3-.2.2-.4.2-.7.1-.3-.1-1.5-.6-2.8-1.8-1-1-1.7-2.3-1.9-2.6-.2-.3 0-.5.1-.6.2-.2.3-.4.5-.6.2-.2.3-.4.4-.6.1-.2 0-.4 0-.6l-.9-2.2z" />
          </svg>


        </motion.a>
      )}
    </AnimatePresence>
  );
}
