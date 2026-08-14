// Toggles the inline contact-form panel open/closed from the mail icon
// button. The icon itself is two stacked SVGs crossfaded via opacity
// (see contact.css), so no layout shift ever happens on toggle.
(function () {
  const trigger = document.getElementById('mailTrigger');
  const panel = document.getElementById('contactFormPanel');
  if (!trigger || !panel) return;

  const label = trigger.querySelector('.mail-trigger-text');

  function toggle() {
    const isOpen = trigger.classList.toggle('is-open');
    panel.classList.toggle('is-open', isOpen);
    trigger.setAttribute('aria-expanded', String(isOpen));
    if (label) label.textContent = isOpen ? 'Close' : 'Send a message';

    if (isOpen) {
      const firstField = panel.querySelector('input[name="name"]');
      // Wait out the slide-open transition so focus doesn't yank the
      // page around mid-animation.
      if (firstField) setTimeout(() => firstField.focus(), 300);
    }
  }

  // Triggering the slide-open transition before the page had fully
  // loaded made it glitch intermittently (the panel's height was still
  // settling as late-loading fonts/layout shifted it mid-animation). A
  // click before load doesn't get dropped — it just fires once loading
  // finishes instead of animating against a still-moving layout.
  let ready = document.readyState === 'complete';
  let pendingClick = false;

  if (!ready) {
    window.addEventListener(
      'load',
      () => {
        ready = true;
        if (pendingClick) {
          pendingClick = false;
          toggle();
        }
      },
      { once: true }
    );
  }

  trigger.addEventListener('click', () => {
    if (!ready) {
      pendingClick = true;
      return;
    }
    toggle();
  });
})();

// Submits the contact form to FormSubmit over AJAX so sending never
// navigates away from the page — the status line below the button
// reports progress instead.
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = form.querySelector('.contact-form-status');
  const submitButton = form.querySelector('.contact-submit');
  const ENDPOINT = 'https://formsubmit.co/ajax/aaron.meys9@gmail.com';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    status.dataset.state = 'sending';
    status.textContent = 'Sending…';

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error('Request failed');
      status.dataset.state = 'sent';
      status.textContent = "Sent — I'll get back to you soon.";
      form.reset();
    } catch (err) {
      status.dataset.state = 'error';
      status.textContent = 'Something went wrong — email me directly instead.';
    } finally {
      submitButton.disabled = false;
    }
  });
})();
